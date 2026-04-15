import Foundation
import Capacitor
import WebKit
import UIKit

@objc(GradeScraperPlugin)
public class GradeScraperPlugin: CAPPlugin, WKNavigationDelegate, WKUIDelegate {
    
    var scraperWebView: WKWebView?
    var activeCall: CAPPluginCall?
    var closeButton: UIButton?
    
    @objc func startScraping(_ call: CAPPluginCall) {
        self.activeCall = call
        
        DispatchQueue.main.async {
            guard let bridgeWV = self.bridge?.webView else {
                call.reject("Main webview not found")
                return
            }
            
            self.cleanup()
            
            let config = WKWebViewConfiguration()
            config.preferences.javaScriptCanOpenWindowsAutomatically = true
            
            let frame = bridgeWV.frame
            self.scraperWebView = WKWebView(frame: frame, configuration: config)
            self.scraperWebView?.navigationDelegate = self
            self.scraperWebView?.uiDelegate = self
            
            // Spoof desktop browser to keep Microsoft Azure AD happy
            self.scraperWebView?.customUserAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15"

            // Close button overlay
            let btn = UIButton(type: .system)
            btn.setTitle("Cancel", for: .normal)
            btn.setTitleColor(.white, for: .normal)
            btn.backgroundColor = UIColor(white: 0.0, alpha: 0.5)
            btn.layer.cornerRadius = 8
            btn.frame = CGRect(x: frame.size.width - 90, y: 50, width: 75, height: 35)
            btn.addTarget(self, action: #selector(self.cancelScraping), for: .touchUpInside)
            self.closeButton = btn
            
            if let wv = self.scraperWebView {
                bridgeWV.superview?.addSubview(wv)
                wv.addSubview(btn)
                let url = URL(string: "https://srvusd.infinitecampus.org/campus/portal/students/sanRamon.jsp")!
                wv.load(URLRequest(url: url))
            }
        }
    }
    
    @objc func cancelScraping() {
        DispatchQueue.main.async {
            self.cleanup()
            self.activeCall?.reject("User cancelled login")
            self.activeCall = nil
        }
    }
    
    func cleanup() {
        self.scraperWebView?.removeFromSuperview()
        self.closeButton?.removeFromSuperview()
        self.scraperWebView = nil
        self.closeButton = nil
    }
    
    // BESSY TRICK: Force all external popups (Microsoft Azure AD) into the current WebView Sandbox frame natively!
    public func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if navigationAction.targetFrame == nil {
            webView.load(navigationAction.request)
        }
        return nil
    }

    // BESSY TRICK 2: If Azure AD attempts to launch the Microsoft Authenticator App (msauth://), WKWebView will silently freeze and die by default. 
    // We must manually intercept non-HTTP deep links and command the iOS System to open them!
    public func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if let url = navigationAction.request.url, let scheme = url.scheme?.lowercased() {
            if !["http", "https", "about", "blob"].contains(scheme) {
                // It's a deep link (e.g., msauth:// or classlink://)
                if UIApplication.shared.canOpenURL(url) {
                    UIApplication.shared.open(url, options: [:], completionHandler: nil)
                }
                decisionHandler(.cancel)
                return
            }
        }
        decisionHandler(.allow)
    }

    public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        let url = webView.url?.absoluteString ?? ""
        
        if url.lowercased().contains("infinitecampus.org") {
            let scraperJS = """
                if(!window.ic_running){window.ic_running=true;localStorage.removeItem('ic_intercepted_grades');var timer=setInterval(async function(){var match=document.documentElement.innerHTML.match(/personID['"]?\\s*[:=]\\s*['"]?(\\d+)['"]?/i);if(match&&match[1]){clearInterval(timer);try{var pId=match[1];var hdrs={'Accept':'application/json'};var bUrl='https://srvusd.infinitecampus.org';var rosterRes=await fetch(bUrl+'/campus/resources/portal/roster?&personID='+pId,{headers:hdrs});var roster=await rosterRes.json();var assignRes=await fetch(bUrl+'/campus/api/portal/assignment/listView?&personID='+pId,{headers:hdrs});var assign=await assignRes.json();var grades=[];var gRes=await fetch(bUrl+'/campus/resources/portal/grades',{headers:hdrs});if(gRes.ok){var gData=await gRes.json();if(Array.isArray(gData)&&gData.length>0&&gData[0].courses){grades=gData;}else{var gRes2=await fetch(bUrl+'/campus/api/portal/grades?personID='+pId,{headers:hdrs});if(gRes2.ok)grades=await gRes2.json();}}var cats=[];var dets=[];for(var i=0;i<roster.length;i++){var c=roster[i];if(c.sectionID){var cRes=await fetch(bUrl+'/campus/api/instruction/categories?sectionID='+c.sectionID,{headers:hdrs});if(cRes.ok){var cData=await cRes.json();if(Array.isArray(cData))cats.push(...cData);}var dRes=await fetch(bUrl+'/campus/resources/portal/grades/detail/'+c.sectionID+'?showAllTerms=false&classroomSectionID='+c.sectionID,{headers:hdrs});if(dRes.ok)dets.push({sectionID:c.sectionID,data:await dRes.json()});}}var payload={name:'Student (Live iOS Sync)',student_id:pId,courses:roster,assignments:assign||[],grades:grades||[],categories:cats,detail_data:dets};localStorage.setItem('ic_intercepted_grades',JSON.stringify({status:'success',data:[payload]}));}catch(err){localStorage.setItem('ic_intercepted_grades',JSON.stringify({status:'error',message:err.toString()}));}}},1000);} true;
            """
            
            webView.evaluateJavaScript(scraperJS) { _, _ in }
            
            // Start polling natively
            pollForData(webView)
        }
    }
    
    func pollForData(_ webView: WKWebView) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
            guard let self = self, let call = self.activeCall else { return }
            
            webView.evaluateJavaScript("localStorage.getItem('ic_intercepted_grades');") { result, error in
                if let rawJSON = result as? String, rawJSON != "null", !rawJSON.isEmpty {
                    self.cleanup()
                    
                    if rawJSON.contains("\"status\":\"error\"") {
                        call.reject(rawJSON)
                    } else {
                        call.resolve([
                            "data": rawJSON
                        ])
                    }
                    self.activeCall = nil
                } else {
                    if self.scraperWebView != nil {
                        self.pollForData(webView)
                    }
                }
            }
        }
    }
}
