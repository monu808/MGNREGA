export const formatNumber = (num) => {
  if (!num) return '0';
  
  if (num >= 10000000) {
    return `${(num / 10000000).toFixed(2)} Cr`;
  } else if (num >= 100000) {
    return `${(num / 100000).toFixed(2)} L`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(2)} K`;
  }
  
  return num.toLocaleString('en-IN');
};

export const formatCurrency = (amount) => {
  if (!amount) return '₹0';
  
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  
  return `₹${amount.toLocaleString('en-IN')}`;
};

export const getPerformanceColor = (score) => {
  if (score >= 75) return '#4CAF50';
  if (score >= 50) return '#8BC34A';
  if (score >= 30) return '#FFC107';
  return '#f44336';
};

export const getPerformanceIcon = (score) => {
  if (score >= 75) return '✅';
  if (score >= 50) return '👍';
  if (score >= 30) return '⚠️';
  return '❌';
};

export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  });
};

export const speakText = (text, lang = 'hi-IN') => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }
};
