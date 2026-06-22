import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert, Platform } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { useWeddingStore } from '../../store/weddingStore';
import { supabase } from '../../lib/supabase/client';
import { theme as appTheme } from '../../config/theme';

interface Photo {
  id: string;
  uri: string;
  uploadedBy: string;
  uploadedAt: Date;
  caption?: string;
}

export default function PhotosScreen() {
  const { wedding } = useWeddingStore();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
        // Upload to Supabase Storage
        const file = result.assets[0];
        const fileExt = file.uri.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${wedding?.id}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('wedding-photos')
          .upload(filePath, file.uri, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('wedding-photos')
          .getPublicUrl(filePath);

        const newPhoto: Photo = {
          id: Date.now().toString(),
          uri: publicUrl,
          uploadedBy: 'You',
          uploadedAt: new Date(),
        };
        setPhotos([...photos, newPhoto]);
      } catch (error) {
        Alert.alert('Error', 'Failed to upload photo');
        console.error('Upload error:', error);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleTakePhoto = async () => {
    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is needed to take photos'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
        // Upload to Supabase Storage
        const file = result.assets[0];
        const fileExt = file.uri.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${wedding?.id}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('wedding-photos')
          .upload(filePath, file.uri, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('wedding-photos')
          .getPublicUrl(filePath);

        const newPhoto: Photo = {
          id: Date.now().toString(),
          uri: publicUrl,
          uploadedBy: 'You',
          uploadedAt: new Date(),
        };
        setPhotos([...photos, newPhoto]);
      } catch (error) {
        Alert.alert('Error', 'Failed to upload photo');
        console.error('Upload error:', error);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => setPhotos(photos.filter(p => p.id !== photoId))
        },
      ]
    );
  };

  const handleSharePhoto = async (photo: Photo) => {
    try {
      await Sharing.shareAsync(photo.uri);
    } catch (error) {
      Alert.alert('Error', 'Failed to share photo');
    }
  };

  const handleDownloadPhoto = async (photo: Photo) => {
    if (Platform.OS === 'web') {
      // For web, open the image in a new tab
      try {
        await Sharing.shareAsync(photo.uri);
      } catch (error) {
        Alert.alert('Error', 'Failed to open photo');
      }
      return;
    }

    // Dynamic import for native platforms only
    try {
      const MediaLibrary = await import('expo-media-library');
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.createAssetAsync(photo.uri);
        Alert.alert('Success', 'Photo saved to device');
      } else {
        Alert.alert('Permission Denied', 'Need permission to save photos');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to download photo');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Photo Hub</Text>
        <Text style={styles.headerSubtitle}>
          {photos.length} photos
        </Text>
      </View>

      {/* Upload Actions */}
      <View style={styles.uploadActions}>
        <Pressable 
          style={styles.uploadButton}
          onPress={handlePickImage}
          disabled={uploading}
        >
          <Ionicons name="images" size={24} color={appTheme.text} />
          <Text style={styles.uploadButtonText}>Pick from Gallery</Text>
        </Pressable>
        
        <Pressable 
          style={styles.uploadButton}
          onPress={handleTakePhoto}
          disabled={uploading}
        >
          <Ionicons name="camera" size={24} color={appTheme.text} />
          <Text style={styles.uploadButtonText}>Take Photo</Text>
        </Pressable>
      </View>

      {uploading && (
        <View style={styles.uploadingContainer}>
          <Text style={styles.uploadingText}>Uploading photo...</Text>
        </View>
      )}

      {/* Photo Grid */}
      {photos.length > 0 ? (
        <View style={styles.photoGrid}>
          {photos.map((photo) => (
            <Pressable
              key={photo.id}
              style={styles.photoCard}
              onPress={() => setSelectedPhoto(photo)}
            >
              <Image source={{ uri: photo.uri }} style={styles.photoImage} />
              <View style={styles.photoOverlay}>
                <Text style={styles.photoDate}>
                  {photo.uploadedAt.toLocaleDateString()}
                </Text>
                <Text style={styles.photoUploader}>
                  {photo.uploadedBy}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="images" size={64} color={appTheme.textDisabled} />
          <Text style={styles.emptyTitle}>No photos yet</Text>
          <Text style={styles.emptyText}>
            Upload photos from your wedding day or let guests contribute
          </Text>
          <Pressable style={styles.emptyButton} onPress={handlePickImage}>
            <Text style={styles.emptyButtonText}>Upload First Photo</Text>
          </Pressable>
        </View>
      )}

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <View style={styles.modal}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedPhoto(null)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setSelectedPhoto(null)}>
                <Ionicons name="close" size={24} color={appTheme.text} />
              </Pressable>
              <View style={styles.modalActions}>
                <Pressable onPress={() => handleSharePhoto(selectedPhoto)}>
                  <Ionicons name="share-social" size={24} color={appTheme.text} />
                </Pressable>
                <Pressable onPress={() => handleDownloadPhoto(selectedPhoto)}>
                  <Ionicons name="download" size={24} color={appTheme.text} />
                </Pressable>
                <Pressable onPress={() => {
                  setSelectedPhoto(null);
                  handleDeletePhoto(selectedPhoto.id);
                }}>
                  <Ionicons name="trash" size={24} color={appTheme.error} />
                </Pressable>
              </View>
            </View>
            
            <Image source={{ uri: selectedPhoto.uri }} style={styles.modalImage} />
            
            <View style={styles.modalFooter}>
              <Text style={styles.modalCaption}>
                {selectedPhoto.caption || 'No caption'}
              </Text>
              <Text style={styles.modalMeta}>
                Uploaded by {selectedPhoto.uploadedBy} on {selectedPhoto.uploadedAt.toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Guest Upload Link */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Guest Photo Upload</Text>
        <View style={styles.guestUploadCard}>
          <Ionicons name="qr-code" size={32} color={appTheme.text} />
          <View style={styles.guestUploadInfo}>
            <Text style={styles.guestUploadTitle}>
              Let guests upload photos
            </Text>
            <Text style={styles.guestUploadText}>
              Share this QR code with guests so they can contribute photos
            </Text>
          </View>
          <Pressable style={styles.shareButton}>
            <Ionicons name="share-social" size={20} color={appTheme.text} />
            <Text style={styles.shareButtonText}>Share Link</Text>
          </Pressable>
        </View>
      </View>

      {/* Albums */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Albums</Text>
        
        <Pressable style={styles.albumCard}>
          <View style={styles.albumPreview}>
            <Ionicons name="images" size={32} color={appTheme.textSecondary} />
          </View>
          <View style={styles.albumInfo}>
            <Text style={styles.albumName}>All Photos</Text>
            <Text style={styles.albumCount}>{photos.length} photos</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={appTheme.textDisabled} />
        </Pressable>

        <Pressable style={styles.albumCard}>
          <View style={styles.albumPreview}>
            <Ionicons name="heart" size={32} color={appTheme.error} />
          </View>
          <View style={styles.albumInfo}>
            <Text style={styles.albumName}>Favorites</Text>
            <Text style={styles.albumCount}>0 photos</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={appTheme.textDisabled} />
        </Pressable>

        <Pressable style={styles.createAlbumButton}>
          <Ionicons name="add" size={20} color={appTheme.text} />
          <Text style={styles.createAlbumButtonText}>Create Album</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.background,
  },
  header: {
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderColor: appTheme.colors.surface.raised,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: appTheme.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: appTheme.textSecondary,
  },
  uploadActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: appTheme.surface,
    paddingVertical: 14,
    borderRadius: 12,
  },
  uploadButtonText: {
    color: appTheme.text,
    fontSize: 14,
    fontWeight: '600',
  },
  uploadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: 14,
    color: appTheme.textSecondary,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  photoCard: {
    width: '50%',
    aspectRatio: 1,
    padding: 4,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    padding: 8,
  },
  photoDate: {
    fontSize: 10,
    color: appTheme.text,
    marginBottom: 2,
  },
  photoUploader: {
    fontSize: 10,
    color: appTheme.text,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: appTheme.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: appTheme.textDisabled,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: appTheme.surface,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: appTheme.text,
    fontSize: 14,
    fontWeight: '600',
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: '100%',
    height: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 16,
  },
  modalImage: {
    width: '100%',
    height: '60%',
    resizeMode: 'contain',
  },
  modalFooter: {
    padding: 16,
    backgroundColor: '#000',
  },
  modalCaption: {
    fontSize: 16,
    color: appTheme.text,
    marginBottom: 8,
  },
  modalMeta: {
    fontSize: 12,
    color: appTheme.textDisabled,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: appTheme.colors.surface.raised,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: appTheme.text,
    marginBottom: 16,
  },
  guestUploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appTheme.colors.surface.raised,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  guestUploadInfo: {
    flex: 1,
  },
  guestUploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: appTheme.text,
    marginBottom: 4,
  },
  guestUploadText: {
    fontSize: 12,
    color: appTheme.textSecondary,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: appTheme.surface,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  shareButtonText: {
    color: appTheme.text,
    fontSize: 14,
    fontWeight: '600',
  },
  albumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appTheme.colors.surface.raised,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  albumPreview: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: appTheme.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  albumInfo: {
    flex: 1,
  },
  albumName: {
    fontSize: 16,
    fontWeight: '600',
    color: appTheme.text,
    marginBottom: 4,
  },
  albumCount: {
    fontSize: 12,
    color: appTheme.textSecondary,
  },
  createAlbumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: appTheme.colors.surface.raised,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: appTheme.colors.border.default,
    borderStyle: 'dashed',
  },
  createAlbumButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: appTheme.text,
  },
});
