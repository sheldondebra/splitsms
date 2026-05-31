(function () {
  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function getApiKeyInput() {
    return qs('#splitsms-api-key-input');
  }

  function resolveApiKeyValue() {
    var keyInput = getApiKeyInput();
    if (!keyInput) {
      return '';
    }
    var typed = keyInput.value.trim();
    if (typed) {
      return typed;
    }
    if (keyInput.getAttribute('data-has-saved') === '1') {
      return (keyInput.getAttribute('data-saved-key') || '').trim();
    }
    return '';
  }

  var keyInput = getApiKeyInput();
  var keyToggle = qs('#splitsms-api-key-toggle');
  if (keyInput && keyToggle) {
    keyToggle.addEventListener('click', function () {
      var value = resolveApiKeyValue();
      if (!value) {
        return;
      }
      var reveal = keyInput.type === 'password';
      if (reveal) {
        keyInput.type = 'text';
        keyInput.value = value;
        keyInput.setAttribute('readonly', 'readonly');
        keyToggle.textContent = 'Hide';
        keyToggle.setAttribute('aria-pressed', 'true');
      } else {
        keyInput.type = 'password';
        keyInput.removeAttribute('readonly');
        if (keyInput.getAttribute('data-has-saved') === '1' && !keyInput.dataset.userEdited) {
          keyInput.value = '';
        }
        keyToggle.textContent = 'Show';
        keyToggle.setAttribute('aria-pressed', 'false');
      }
    });

    keyInput.addEventListener('input', function () {
      keyInput.dataset.userEdited = '1';
      keyInput.removeAttribute('readonly');
    });
  }

  function getSettingsForm() {
    return qs('form.splitsms-settings-card') || qs('.splitsms-settings-card form');
  }

  function appendSettingsFields(fd) {
    var key = resolveApiKeyValue();
    if (key) {
      fd.append('api_key', key);
    }
    var form = getSettingsForm();
    if (!form) {
      return;
    }
    var urlInput = qs('input[name="splitsms[api_base_url]"]', form);
    if (urlInput && urlInput.value.trim()) {
      fd.append('api_base_url', urlInput.value.trim());
    }
  }

  var testBtn = qs('#splitsms-test-btn');
  var testOut = qs('#splitsms-test-result');
  if (testBtn && testOut && window.SplitSMSAdmin) {
    testBtn.addEventListener('click', function () {
      testOut.textContent = SplitSMSAdmin.strings.testing;
      var fd = new FormData();
      fd.append('action', 'splitsms_test_connection');
      fd.append('nonce', SplitSMSAdmin.nonceTest);
      appendSettingsFields(fd);
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

  var copyWebhookBtn = qs('#splitsms-copy-webhook');
  var webhookEl = qs('#splitsms-paystack-webhook-url');
  if (copyWebhookBtn && webhookEl) {
    copyWebhookBtn.addEventListener('click', function () {
      var url = webhookEl.textContent.trim();
      if (!url) {
        return;
      }
      function onCopied() {
        copyWebhookBtn.textContent = 'Copied';
        setTimeout(function () {
          copyWebhookBtn.textContent = 'Copy webhook URL';
        }, 2000);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(onCopied).catch(function () {
          window.prompt('Copy webhook URL:', url);
        });
      } else {
        window.prompt('Copy webhook URL:', url);
      }
    });
  }
})();
