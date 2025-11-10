import axios from 'axios';

const getBaseURL = () => {
  return localStorage.getItem('VITE_API_URL') || 
         import.meta.env.VITE_API_URL || 
         'http://localhost:8000';
};

export const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Update base URL when needed
export const updateBaseURL = (url: string) => {
  localStorage.setItem('VITE_API_URL', url);
  api.defaults.baseURL = url;
};

// Health endpoints
export const postHealthPredict = async (payload: any) => {
  const { data } = await api.post('/health/predict', payload);
  return data;
};

// Entertainment endpoints
export const postMovieRecommend = async (payload: { title: string; k?: number }) => {
  const { data } = await api.post('/entertainment/recommend', payload);
  return data;
};

// Food endpoints
export const postFoodPlan = async (payload: any) => {
  const { data } = await api.post('/food/plan', payload);
  return data;
};

export const postFoodRecommend = async (payload: { likes: string[]; k?: number }) => {
  const { data } = await api.post('/food/recommend', payload);
  return data;
};

export const postFoodProject = async (payload: { plan_kcal: number; tdee: number }) => {
  const { data } = await api.post('/food/project', payload);
  return data;
};

// Social endpoints
export const postSocialSentiment = async (payload: { text: string }) => {
  const { data } = await api.post('/social/sentiment', payload);
  return data;
};

export const postWhatsAppInsights = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/social/whatsapp/insights', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

// Test endpoint
export const testAPI = async () => {
  const { data } = await api.get('/');
  return data;
};
