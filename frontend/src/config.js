const isProd = import.meta.env.PROD;
const API_BASE_URL = isProd 
  ? window.location.origin 
  : `http://${window.location.hostname}:5000`;

export default API_BASE_URL;
