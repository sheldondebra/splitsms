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

  function runPluginUpdate(btn, resultEl) {
    if (!btn || !window.SplitSMSAdmin || !SplitSMSAdmin.nonceUpdate) {
      return;
    }
    var buttons = document.querySelectorAll(
      '#splitsms-update-plugin-btn, #splitsms-update-plugin-btn-settings, #splitsms-update-plugin-btn-help'
    );
    buttons.forEach(function (b) {
      b.disabled = true;
    });
    if (resultEl) {
      resultEl.textContent = SplitSMSAdmin.strings.updating || 'Updating…';
      resultEl.style.color = '';
    }
    btn.textContent = SplitSMSAdmin.strings.updating || 'Updating…';

    var fd = new FormData();
    fd.append('action', 'splitsms_update_plugin');
    fd.append('nonce', SplitSMSAdmin.nonceUpdate);

    fetch(SplitSMSAdmin.ajaxUrl, { method: 'POST', body: fd, credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success) {
          var msg = (data.data && data.data.message) ? data.data.message : (SplitSMSAdmin.strings.updateDone || 'Updated');
          if (resultEl) {
            resultEl.textContent = msg;
            resultEl.style.color = '#0a7a0a';
          }
          window.setTimeout(function () {
            window.location.reload();
          }, 1200);
          return;
        }
        var err = (data.data && data.data.message) ? data.data.message : 'Update failed';
        if (resultEl) {
          resultEl.textContent = err;
          resultEl.style.color = '#b32d2e';
        }
        buttons.forEach(function (b) {
          b.disabled = false;
          if (b.id === 'splitsms-update-plugin-btn') {
            b.textContent = 'Update';
          } else {
            b.textContent = 'Update plugin';
          }
        });
      })
      .catch(function () {
        if (resultEl) {
          resultEl.textContent = 'Request failed';
          resultEl.style.color = '#b32d2e';
        }
        buttons.forEach(function (b) { b.disabled = false; });
      });
  }

    var updateBtn = qs('#splitsms-update-plugin-btn');
    var updateOut = qs('#splitsms-update-plugin-result');
    if (updateBtn) {
        updateBtn.addEventListener('click', function () {
            runPluginUpdate(updateBtn, updateOut);
        });
    }

    var updateBtnSettings = qs('#splitsms-update-plugin-btn-settings');
  var updateOutSettings = qs('#splitsms-update-plugin-result-settings');
  if (updateBtnSettings) {
    updateBtnSettings.addEventListener('click', function () {
      runPluginUpdate(updateBtnSettings, updateOutSettings);
    });
  }

  var updateBtnHelp = qs('#splitsms-update-plugin-btn-help');
  var updateOutHelp = qs('#splitsms-update-plugin-result-help');
  if (updateBtnHelp) {
    updateBtnHelp.addEventListener('click', function () {
      runPluginUpdate(updateBtnHelp, updateOutHelp);
    });
  }

  document.querySelectorAll('.splitsms-notice-update-link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (!window.SplitSMSAdmin || !SplitSMSAdmin.nonceUpdate) {
        return;
      }
      e.preventDefault();
      var fakeBtn = document.createElement('button');
      runPluginUpdate(fakeBtn, null);
    });
  });

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

  var replaceKeyBtn = qs('#splitsms-replace-key');
  var viewKeyBtn = qs('#splitsms-view-key');
  var apiKeyRow = qs('#splitsms-api-key-row');
  var apiConnected = qs('#splitsms-api-connected');
  if (viewKeyBtn && apiKeyRow) {
    viewKeyBtn.addEventListener('click', function () {
      apiKeyRow.hidden = false;
      var input = getApiKeyInput();
      var value = resolveApiKeyValue();
      if (input && value) {
        input.type = 'text';
        input.value = value;
        input.setAttribute('readonly', 'readonly');
        input.focus();
      }
    });
  }
  if (replaceKeyBtn && apiKeyRow) {
    replaceKeyBtn.addEventListener('click', function () {
      apiKeyRow.hidden = false;
      apiKeyRow.classList.remove('splitsms-api-key-row--replace');
      if (apiConnected) {
        apiConnected.hidden = true;
      }
      var input = getApiKeyInput();
      if (input) {
        input.focus();
        input.value = '';
        input.type = 'password';
        input.removeAttribute('readonly');
        input.dataset.userEdited = '1';
      }
    });
  }

  var deleteKeyBtn = qs('#splitsms-delete-key');
  if (deleteKeyBtn) {
    deleteKeyBtn.addEventListener('click', function (e) {
      var msg = (window.SplitSMSAdmin && SplitSMSAdmin.strings && SplitSMSAdmin.strings.confirmDeleteKey)
        ? SplitSMSAdmin.strings.confirmDeleteKey
        : 'Delete this API key permanently? This cannot be undone.';
      if (!window.confirm(msg)) {
        e.preventDefault();
      }
    });
  }

  function initSenderPicker() {
    var picker = qs('#splitsms-sender-picker');
    if (!picker) {
      return;
    }

    var search = qs('#splitsms-sender-search');
    var list = qs('#splitsms-sender-list');
    var hidden = qs('#splitsms-sender-id-value');
    var toggle = qs('#splitsms-sender-toggle');
    var selectedLight = qs('#splitsms-sender-selected-light');
    var hint = qs('#splitsms-sender-hint');
    if (!search || !list || !hidden) {
      return;
    }

    function allOptions() {
      return list.querySelectorAll('.splitsms-sender-picker__option');
    }

    function setOpen(open) {
      list.hidden = !open;
      search.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function selectOption(option) {
      if (!option) {
        return;
      }
      var value = option.getAttribute('data-value') || '';
      var tone = option.getAttribute('data-tone') || 'pending';
      hidden.value = value;
      search.value = value;
      allOptions().forEach(function (opt) {
        var selected = opt === option;
        opt.classList.toggle('is-selected', selected);
        opt.setAttribute('aria-selected', selected ? 'true' : 'false');
      });
      if (selectedLight) {
        selectedLight.className = 'splitsms-status-light splitsms-status-light--' + tone;
      }
      if (hint && tone !== 'ok') {
        hint.textContent = tone === 'denied'
          ? 'This sender ID was denied — choose another or register a new one on SplitSMS.'
          : 'This sender ID is pending approval — SMS may fail until SplitSMS activates it.';
      }
      setOpen(false);
    }

    function filterOptions(query) {
      var q = query.trim().toLowerCase();
      var visible = 0;
      allOptions().forEach(function (opt) {
        var value = (opt.getAttribute('data-value') || '').toLowerCase();
        var show = !q || value.indexOf(q) !== -1;
        opt.hidden = !show;
        if (show) {
          visible += 1;
        }
      });
      setOpen(visible > 0);
    }

    search.addEventListener('focus', function () {
      filterOptions(search.value);
    });

    search.addEventListener('input', function () {
      hidden.value = '';
      filterOptions(search.value);
    });

    search.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        var first = list.querySelector('.splitsms-sender-picker__option:not([hidden])');
        if (first) {
          selectOption(first);
        }
      }
    });

    if (toggle) {
      toggle.addEventListener('click', function () {
        setOpen(list.hidden);
        if (!list.hidden) {
          search.focus();
        }
      });
    }

    list.addEventListener('click', function (e) {
      var option = e.target.closest('.splitsms-sender-picker__option');
      if (option) {
        selectOption(option);
      }
    });

    document.addEventListener('click', function (e) {
      if (!picker.contains(e.target)) {
        setOpen(false);
        if (hidden.value && search.value !== hidden.value) {
          search.value = hidden.value;
        }
      }
    });

    var selected = list.querySelector('.splitsms-sender-picker__option.is-selected');
    if (!selected && hidden.value) {
      allOptions().forEach(function (opt) {
        if (opt.getAttribute('data-value') === hidden.value) {
          selectOption(opt);
        }
      });
    } else if (!selected && !hidden.value) {
      var defaultOpt = list.querySelector('.splitsms-sender-picker__option[data-tone="ok"]') || allOptions()[0];
      if (defaultOpt) {
        selectOption(defaultOpt);
      }
    }
  }

  initSenderPicker();

  var settingsForm = getSettingsForm();
  if (settingsForm) {
    settingsForm.addEventListener('submit', function (e) {
      var list = qs('#splitsms-sender-list');
      var hidden = qs('#splitsms-sender-id-value');
      if (!list || !hidden || !qs('#splitsms-sender-picker')) {
        return;
      }
      var value = hidden.value.trim();
      if (!value) {
        return;
      }
      var allowed = false;
      list.querySelectorAll('.splitsms-sender-picker__option').forEach(function (opt) {
        if (opt.getAttribute('data-value') === value) {
          allowed = true;
        }
      });
      if (!allowed) {
        e.preventDefault();
        window.alert('Choose a sender ID from your SplitSMS account.');
      }
    });
  }

  var sectionNav = qs('.splitsms-section-nav');
  if (sectionNav) {
    var navLinks = sectionNav.querySelectorAll('a[href^="#"]');
    var sections = [];

    navLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        var id = link.getAttribute('href').slice(1);
        var target = document.getElementById(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.replaceState(null, '', '#' + id);
          navLinks.forEach(function (l) { l.classList.remove('is-active'); });
          link.classList.add('is-active');
        }
      });

      var sectionId = link.getAttribute('data-section') || link.getAttribute('href').slice(1);
      var el = document.getElementById(sectionId);
      if (el) {
        sections.push({ id: sectionId, link: link, el: el });
      }
    });

    function updateActiveSection() {
      var scrollY = window.scrollY || window.pageYOffset;
      var current = sections[0];
      sections.forEach(function (item) {
        var top = item.el.getBoundingClientRect().top + scrollY - 120;
        if (scrollY >= top) {
          current = item;
        }
      });
      if (current) {
        navLinks.forEach(function (l) { l.classList.remove('is-active'); });
        current.link.classList.add('is-active');
      }
    }

    if (sections.length) {
      updateActiveSection();
      window.addEventListener('scroll', updateActiveSection, { passive: true });
    }
  }

  function initFormsManager() {
    var page = qs('.splitsms-forms-page');
    if (!page) {
      return;
    }

    page.querySelectorAll('.splitsms-switch__input').forEach(function (input) {
      input.addEventListener('change', function () {
        var card = input.closest('.splitsms-form-card');
        var label = input.parentElement.querySelector('.splitsms-switch__label');
        if (card) {
          card.classList.toggle('is-enabled', input.checked);
          card.classList.toggle('is-disabled', !input.checked);
        }
        if (label) {
          label.textContent = input.checked ? 'On' : 'Off';
        }
      });
    });

    page.querySelectorAll('.splitsms-form-card__toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card = btn.closest('.splitsms-form-card');
        var body = card ? card.querySelector('.splitsms-form-card__body') : null;
        if (!body) {
          return;
        }
        var open = body.hasAttribute('hidden');
        if (open) {
          body.removeAttribute('hidden');
          btn.setAttribute('aria-expanded', 'true');
        } else {
          body.setAttribute('hidden', 'hidden');
          btn.setAttribute('aria-expanded', 'false');
        }
      });
    });

    page.querySelectorAll('.splitsms-forms-filter').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = btn.getAttribute('data-filter') || 'all';
        page.querySelectorAll('.splitsms-forms-filter').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
        });
        page.querySelectorAll('.splitsms-form-card').forEach(function (card) {
          var group = card.getAttribute('data-filter-group') || 'forms';
          var show = filter === 'all' || group === filter;
          card.classList.toggle('is-filter-hidden', !show);
        });
      });
    });

    var refreshBtn = qs('#splitsms-refresh-forms');
    if (refreshBtn && window.SplitSMSAdmin) {
      refreshBtn.addEventListener('click', function () {
        refreshBtn.disabled = true;
        var fd = new FormData();
        fd.append('action', 'splitsms_refresh_forms');
        fd.append('nonce', SplitSMSAdmin.nonceForms);
        fetch(SplitSMSAdmin.ajaxUrl, { method: 'POST', body: fd, credentials: 'same-origin' })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (data.success && data.data && data.data.redirect) {
              window.location.href = data.data.redirect;
              return;
            }
            refreshBtn.disabled = false;
          })
          .catch(function () {
            refreshBtn.disabled = false;
          });
      });
    }
  }

  initFormsManager();
})();
