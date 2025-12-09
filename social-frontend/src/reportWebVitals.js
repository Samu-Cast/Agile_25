const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry); //stabilità visiva
      getFID(onPerfEntry); //risposta all'azione dell'utente
      getFCP(onPerfEntry); //tempo di caricamento
      getLCP(onPerfEntry); //tempo di caricamento contenuto principale
      getTTFB(onPerfEntry); //velocità server
    });
  }
};

export default reportWebVitals;
