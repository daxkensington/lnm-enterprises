(() => {
  const measurementId = document.currentScript?.dataset.measurementId;
  if (!/^G-[A-Z0-9]+$/.test(measurementId || "")) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", measurementId);
})();
