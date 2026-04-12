import asyncio
import json
import re
import urllib.parse as urlparse
from playwright.async_api import async_playwright

async def fetch_grades_via_playwright():
    """
    Opens a visible browser for the user to log in via ClassLink.
    Extracts the personID from network traffic or DOM, then proactively uses 
    the authenticated session to fetch the exact grade payloads directly!
    """
    results = {
        "status": "error",
        "data": []
    }
    
    person_id = None

    async def handle_request(request):
        nonlocal person_id
        if person_id is None and "personID=" in request.url:
            parsed = urlparse.urlparse(request.url)
            qs = urlparse.parse_qs(parsed.query)
            if "personID" in qs:
                person_id = qs["personID"][0]
                print(f"[Playwright] Successfully snatched Person ID [{person_id}] from network stream.")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(viewport={'width': 1200, 'height': 800})
        page = await context.new_page()

        # Listen to traffic to snag the person ID as the dashboard loads
        page.on("request", handle_request)

        print("[Playwright] Opening San Ramon Valley IC Portal...")
        await page.goto("https://srvusd.infinitecampus.org/campus/portal/students/sanRamon.jsp")

        print("[Playwright] Waiting for you to complete the ClassLink login...")
        
        roster_data = None
        assignments_data = None
        grades_data = None
        categories_data = []
        network_telemetry = {}
        detail_debug = []
        dom_snapshots = {}

        async def intercept_response(response):
            try:
                if "/campus/" in response.url and "json" in response.headers.get("content-type", ""):
                    data = await response.json()
                    network_telemetry[response.url] = data
            except:
                pass

        page.on("response", intercept_response)
        
        try:
            # Check for up to 3 minutes for a successful login event
            for _ in range(120):
                if not person_id:
                    try:
                        content = await page.content()
                        match = re.search(r'personID[\'"]?\s*[:=]\s*[\'"]?(\d+)[\'"]?', content, re.IGNORECASE)
                        if match:
                            person_id = match.group(1)
                            print(f"[Playwright] Successfully snatched Person ID [{person_id}] via DOM scraping.")
                    except:
                        pass
                
                if person_id:
                    print("[Playwright] Authenticated! Proactively fetching API structures using captured secure session...")
                    
                    # Force navigation to the actual grades detail page to definitively trigger category endpoints
                    await page.goto(f"https://srvusd.infinitecampus.org/campus/nav-wrapper/student/portal/student/grades")
                    await asyncio.sleep(4) # Allow React app within IC to fully mount and fetch categories!
                    
                    headers = {"Accept": "application/json"}
                    
                    # Fetch courses
                    roster_resp = await page.request.get(
                        f"https://srvusd.infinitecampus.org/campus/resources/portal/roster?&personID={person_id}",
                        headers=headers
                    )
                    if roster_resp.status == 200:
                        roster_data = await roster_resp.json()
                    
                    # Fetch assignments
                    assign_resp = await page.request.get(
                        f"https://srvusd.infinitecampus.org/campus/api/portal/assignment/listView?&personID={person_id}",
                        headers=headers
                    )
                    if assign_resp.status == 200:
                        assignments_data = await assign_resp.json()

                    # Fetch MONOLITHIC grades payload (this has courses -> gradingTasks -> hasDetail)
                    monolithic_grades = None
                    for grades_url in [
                        f"https://srvusd.infinitecampus.org/campus/resources/portal/grades",
                        f"https://srvusd.infinitecampus.org/campus/api/portal/grades?personID={person_id}",
                    ]:
                        gr = await page.request.get(grades_url, headers=headers)
                        if gr.status == 200:
                            gdata = await gr.json()
                            if isinstance(gdata, list) and len(gdata) > 0:
                                if "courses" in gdata[0]:
                                    monolithic_grades = gdata
                                    grades_data = gdata
                                    print(f"[Playwright] Got monolithic grades from {grades_url}")
                                    break
                                elif not grades_data:
                                    grades_data = gdata
                    
                    # Fetch category weights from the hidden instructional endpoint
                    categories_data = []
                    detail_data = []
                    for course in roster_data:
                        sec_id = course.get("sectionID")
                        if sec_id:
                            cat_url = f"https://srvusd.infinitecampus.org/campus/api/instruction/categories?sectionID={sec_id}"
                            try:
                                cat_resp = await page.request.get(cat_url, headers=headers)
                                if cat_resp.status == 200:
                                    cats = await cat_resp.json()
                                    if isinstance(cats, list):
                                        categories_data.extend(cats)
                            except Exception as e:
                                print(f"[Playwright] Error fetching categories for {sec_id}: {e}")
                                
                            # Try to fetch detailed mapping payload
                            d_url = f"https://srvusd.infinitecampus.org/campus/resources/portal/grades/detail/{sec_id}?showAllTerms=false&classroomSectionID={sec_id}"
                            try:
                                d_resp = await page.request.get(d_url, headers=headers)
                                if d_resp.status == 200:
                                    d_json = await d_resp.json()
                                    detail_data.append({"sectionID": sec_id, "url": d_url, "data": d_json})
                            except Exception as e:
                                pass

                    
                    break
                    
                await asyncio.sleep(1.5)
                
        except Exception as e:
            print(f"[Playwright] Action aborted or timed out: {e}")
        finally:
            print("[Playwright] Closing automated browser.")
            await browser.close()
            
    if roster_data: # Roster is the only strictly required payload
        student_info = {
            "name": "Aditya (Live Link)", 
            "student_id": person_id, 
            "courses": roster_data,
            "assignments": assignments_data or [],
            "grades": grades_data or [],
            "categories": categories_data or [],
            "detail_data": detail_data or [],
            "telemetry": network_telemetry
        }
        
        # DEBUG DUMP FOR SCHEMA INSPECTION
        try:
            with open("debug_dump.json", "w") as f:
                json.dump(student_info, f, indent=2)
        except Exception:
            pass

        results["status"] = "success"
        results["data"] = [student_info]
        print("[Playwright] Live data completely synced into proxy format and dumped to debug_dump.json!")
    else:
        results["message"] = "Failed to extract required API payloads. Did you close the browser early?"

    return results

if __name__ == "__main__":
    res = asyncio.run(fetch_grades_via_playwright())
    print("Test run completed.")
