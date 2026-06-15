(function () {
  var SITE_ORIGIN = document.currentScript && document.currentScript.src
    ? new URL(document.currentScript.src).origin
    : "";

  function initSplitSMSForms() {
    var containers = document.querySelectorAll("[data-splitsms-form]");

    containers.forEach(function (container) {
      var code = container.getAttribute("data-splitsms-form");
      if (!code) return;

      var iframe = document.createElement("iframe");
      iframe.src =
        SITE_ORIGIN +
        "/embed/forms/" +
        encodeURIComponent(code) +
        "?source=script";
      iframe.width = "100%";
      iframe.height = "720";
      iframe.frameBorder = "0";
      iframe.style.border = "0";
      iframe.style.width = "100%";
      iframe.style.maxWidth = "100%";
      iframe.title = "SplitSMS Smart Form";

      container.innerHTML = "";
      container.appendChild(iframe);
    });
  }

  window.addEventListener("message", function (event) {
    if (!event.data || event.data.type !== "splitsms-form-height") return;

    var iframes = document.querySelectorAll('iframe[src*="/embed/forms/"]');
    iframes.forEach(function (iframe) {
      if (iframe.contentWindow === event.source) {
        iframe.style.height = event.data.height + "px";
      }
    });
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSplitSMSForms);
  } else {
    initSplitSMSForms();
  }
})();
