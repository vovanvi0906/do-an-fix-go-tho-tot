import { apiClient } from '../../../services/api/apiClient';
import { tokenStorage } from '../../../services/storage/tokenStorage';

export const profileService = {
  async uploadAvatar(imageUri) {
    const filename = imageUri.split('/').pop() || 'avatar.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    const formData = new FormData();
    formData.append('avatar', { uri: imageUri, name: filename, type });

    const token = await tokenStorage.getToken();
    const headers = { 'Content-Type': 'multipart/form-data' };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    }

    const response = await apiClient.post('/users/upload-avatar', formData, { headers });
    const newAvatarUrl = response?.avatarUrl || response?.data?.avatarUrl;
    if (newAvatarUrl) {
      const currentUser = await tokenStorage.getUser();
      if (currentUser) {
        currentUser.avatarUrl = newAvatarUrl;
        await tokenStorage.saveUser(currentUser);
      }
    }
    return response;
  },

  async updatePhone(phone) {
    const response = await apiClient.patch('/users/update-phone', { phone });
    const updatedUser = response?.user || response?.data?.user;
    if (updatedUser) {
      await tokenStorage.saveUser(updatedUser);
    }
    return response;
  },

  async getProfile() {
    const response = await apiClient.get('/users/profile');
    const profile = response?.data || response;
    if (profile && profile.id) {
      await tokenStorage.saveUser(profile);
    }
    return profile;
  },
};
