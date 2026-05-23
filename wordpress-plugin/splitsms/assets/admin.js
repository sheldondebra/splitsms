(function () {
  function qs(sel) {
    return document.querySelector(sel);
  }

  var testBtn = qs('#splitsms-test-btn');
  var testOut = qs('#splitsms-test-result');
  if (testBtn && testOut && window.SplitSMSAdmin) {
    testBtn.addEventListener('click', function () {
      testOut.textContent = SplitSMSAdmin.strings.testing;
      var fd = new FormData();
      fd.append('action', 'splitsms_test_connection');
      fd.append('nonce', SplitSMSAdmin.nonceTest);
      fetch(SplitSMSAdmin.ajaxUrl, { method: 'POST', body: fd, credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          testOut.textContent = data.success
            ? (data.data && data.data.message ? data.data.message : 'OK')
            : (data.data && data.data.message ? data.data.message : 'Failed');
          testOut.style.color = data.success ? '#0a7a0a' : '#b32d2e';
        })
        .catch(function () {
          testOut.textContent = 'Request failed';
          testOut.style.color = '#b32d2e';
        });
    });
  }

  var sendBtn = qs('#splitsms-send-test-btn');
  var sendOut = qs('#splitsms-send-test-result');
  if (sendBtn && sendOut && window.SplitSMSAdmin) {
    sendBtn.addEventListener('click', function () {
      sendOut.textContent = SplitSMSAdmin.strings.sending;
      var fd = new FormData();
      fd.append('action', 'splitsms_send_test');
      fd.append('nonce', SplitSMSAdmin.nonceSend);
      fetch(SplitSMSAdmin.ajaxUrl, { method: 'POST', body: fd, credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          sendOut.textContent = data.success
            ? (data.data && data.data.message ? data.data.message : 'Sent')
            : (data.data && data.data.message ? data.data.message : 'Failed');
          sendOut.style.color = data.success ? '#0a7a0a' : '#b32d2e';
        })
        .catch(function () {
          sendOut.textContent = 'Request failed';
          sendOut.style.color = '#b32d2e';
        });
    });
  }
})();
