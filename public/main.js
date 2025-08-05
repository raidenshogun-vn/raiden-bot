// Làm đẹp slash command
function beautifySlashCommands() {
  document.querySelectorAll('code').forEach(code => {
    if (code.innerText.trim().startsWith('/')) {
      code.classList.add('slash-command');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  beautifySlashCommands();

  // Hiệu ứng hover cho card
  document.querySelectorAll('.feature-card, .card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'scale(1.03)';
      card.style.boxShadow = '0 8px 32px rgba(52,152,219,0.18)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.boxShadow = '';
    });
  });

  // Toast khi chuyển dark mode
  const darkToggle = document.getElementById('darkToggle');
  if (darkToggle) {
    darkToggle.addEventListener('click', () => {
      setTimeout(() => {
        showToast(document.body.classList.contains('dark') ? 'Đã bật Dark Mode' : 'Đã tắt Dark Mode');
      }, 200);
    });
  }
});

// Toast notification (chỉ giữ lại cho dark mode)
function showToast(msg) {
  let toast = document.createElement('div');
  toast.className = 'furina-toast';
  toast.innerText = msg;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = 1; }, 10);
  setTimeout(() => { toast.style.opacity = 0; }, 1800);
  setTimeout(() => { toast.remove(); }, 2200);
}

// Thêm CSS cho slash-command và toast nếu chưa có
(function(){
  const style = document.createElement('style');
  style.innerHTML = `
  .slash-command {
    background: linear-gradient(90deg, #eaf6fb 60%, #d0e6f7 100%);
    color: #217dbb;
    font-weight: bold;
    border-radius: 6px;
    padding: 2px 10px;
    font-size: 1.08em;
    box-shadow: 0 2px 8px rgba(52,152,219,0.07);
    border: 1px solid #b3d6f2;
    margin: 0 2px;
    letter-spacing: 0.5px;
    transition: background 0.2s, color 0.2s;
  }
  .slash-command:hover {
    background: #3498db;
    color: #fff;
    border-color: #217dbb;
  }
  .furina-toast {
    position: fixed;
    left: 50%;
    bottom: 40px;
    transform: translateX(-50%);
    background: #3498db;
    color: #fff;
    padding: 14px 32px;
    border-radius: 8px;
    font-size: 1.1em;
    font-weight: 500;
    box-shadow: 0 4px 24px rgba(52,152,219,0.18);
    opacity: 0;
    z-index: 9999;
    pointer-events: none;
    transition: opacity 0.3s;
  }
  @media (max-width:600px) {
    .slash-command { font-size: 1em; padding: 2px 7px; }
    .furina-toast { font-size: 1em; padding: 10px 18px; }
  }
  body.dark .slash-command {
    background: linear-gradient(90deg, #23272f 60%, #2c3e50 100%);
    color: #6dd5fa;
    border: 1px solid #217dbb;
  }
  body.dark .slash-command:hover {
    background: #217dbb;
    color: #fff;
    border-color: #6dd5fa;
  }
  `;
  document.head.appendChild(style);
})(); 