import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { LIcon } from '../../components/LIcon';
import { useData } from '../../context/DataContext';

export function WebSyncScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const { T } = useTheme();
  const nav = useNavigation();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: T.bg }]}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: T.text, textAlign: 'center', margin: 20 }}>
            We need your permission to show the camera
          </Text>
          <TouchableOpacity onPress={requestPermission} style={{ backgroundColor: T.accent, padding: 12, borderRadius: 8 }}>
             <Text style={{ color: '#fff', fontWeight: 'bold' }}>Grant Permission</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    
    // In the future, we will send data to Firebase using this UUID: data
    alert(`Scanned Web Session UUID:\n${data}\n\nFirebase integration coming next!`);
    
    setTimeout(() => {
       nav.goBack();
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />
      <SafeAreaView style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backButton}>
             <LIcon.ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Scan Web QR Code</Text>
        </View>
        <View style={styles.focusFrame}>
           <View style={styles.cornerTL} />
           <View style={styles.cornerTR} />
           <View style={styles.cornerBL} />
           <View style={styles.cornerBR} />
        </View>
        <Text style={styles.instructions}>
          Go to lumina.app on your Chromebook and point the camera at the QR code.
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  focusFrame: {
    width: 250,
    height: 250,
    alignSelf: 'center',
    position: 'relative',
  },
  cornerTL: { position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderColor: '#5BC8C2', borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 16 },
  cornerTR: { position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderColor: '#5BC8C2', borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 16 },
  cornerBL: { position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderColor: '#5BC8C2', borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 16 },
  cornerBR: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderColor: '#5BC8C2', borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 16 },
  instructions: {
    color: '#fff',
    textAlign: 'center',
    padding: 32,
    fontSize: 16,
    opacity: 0.8,
  },
});
