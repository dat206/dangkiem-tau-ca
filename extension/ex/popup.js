const cookieInput = document.getElementById("cookie");
const urlInput = document.getElementById("urlInput");
const courseList = document.getElementById("courseList");
const resultEl = document.getElementById("result");

chrome.storage.local.get(["cookie", "courses"], (data) => {
  if (data.cookie) cookieInput.value = data.cookie;
  if (data.courses) {
    data.courses.forEach(courseData => addCourseToUI(courseData));
  }
});

document.getElementById("addCourse").addEventListener("click", () => {
  const courseId = urlInput.value.trim();
  if (!courseId) return;
  
  // Convert course ID to full URL
  const courseUrl = `https://fpl3.poly.edu.vn/ilias.php?ref_id=${courseId}&cmd=view&cmdClass=ilrepositorygui&cmdNode=4t&baseClass=ilrepositorygui`;
  
  addCourseToUI({ id: courseId, url: courseUrl });
  chrome.storage.local.get("courses", (data) => {
    const courses = data.courses || [];
    courses.push({ id: courseId, url: courseUrl });
    chrome.storage.local.set({ courses });
  });
  urlInput.value = "";
});

document.getElementById("clearCourses").addEventListener("click", () => {
  if (confirm("Bạn có chắc muốn xóa tất cả môn học?")) {
    chrome.storage.local.set({ courses: [] });
    courseList.innerHTML = "";
  }
});

cookieInput.addEventListener("input", () => {
  chrome.storage.local.set({ cookie: cookieInput.value });
});

document.getElementById("checkDeadlines").addEventListener("click", async () => {
  resultEl.textContent = "⏳ Đang tải...";

  const cookieStr = cookieInput.value;
  if (!cookieStr) return (resultEl.textContent = "❗Vui lòng nhập cookie");

  const cookies = {};
  cookieStr.split(";").forEach(part => {
    const [key, val] = part.split("=").map(s => s.trim());
    if (key && val) cookies[key] = val;
  });
  const cookieHeader = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ");

  const parser = new DOMParser();
  let output = "";

  chrome.storage.local.get("courses", async ({ courses }) => {
    if (!courses || courses.length === 0) return (resultEl.textContent = "❗Chưa có môn học nào");

    output += `🔍 Bắt đầu kiểm tra ${courses.length} môn học...\n\n`;

    for (const courseData of courses) {
      const url = courseData.url || courseData; // Handle both new format and legacy format
      const courseId = courseData.id || extractCourseId(url);
      
      try {
        output += `📚 Môn học ID: ${courseId}\n`;
        const courseRes = await fetch(url, {
          headers: { "Cookie": cookieHeader },
          credentials: "include"
        });
        
        if (!courseRes.ok) {
          output += `❌ Lỗi HTTP: ${courseRes.status} ${courseRes.statusText}\n`;
          continue;
        }
        
        const html = await courseRes.text();
        const doc = parser.parseFromString(html, "text/html");

        const quizLinks = [...doc.querySelectorAll("a.il_ContainerItemTitle")]
          .map(a => ({
            title: a.textContent.trim(),
            href: a.getAttribute("href")
          }))
          .filter(a => a.href.includes("cmd=infoScreen") && a.href.includes("ilobjtestgui"))
          .map(a => ({
            title: a.title,
            url: new URL(a.href, "https://fpl3.poly.edu.vn/").href
          }));

        output += `🔍 Tìm thấy ${quizLinks.length} quiz\n`;

        if (quizLinks.length === 0) {
          output += `ℹ️ Không tìm thấy quiz nào trong môn học này\n`;
        }

        for (const quiz of quizLinks) {
          try {
            output += `  📌 Đang kiểm tra: ${quiz.title}\n`;
            const quizRes = await fetch(quiz.url, {
              headers: { "Cookie": cookieHeader },
              credentials: "include"
            });
            
            if (!quizRes.ok) {
              output += `  ❌ Lỗi khi tải quiz "${quiz.title}": ${quizRes.status}\n`;
              continue;
            }
            
            const quizHTML = await quizRes.text();
            const quizDoc = parser.parseFromString(quizHTML, "text/html");

            let deadline = "❌ Không tìm thấy deadline";
            quizDoc.querySelectorAll("div.form-group").forEach(group => {
              const label = group.querySelector(".il_InfoScreenProperty");
              const value = group.querySelector(".il_InfoScreenPropertyValue");
              if (label && label.textContent.includes("Thời điểm kết thúc")) {
                deadline = value?.textContent.trim() || deadline;
              }
            });

            const alert = quizDoc.querySelector("div.alert.alert-info");
            if (alert && alert.textContent.includes("bị khóa từ")) {
              deadline = alert.textContent.trim();
            }

            output += `  🕒 Deadline: ${deadline}\n`;
          } catch (e) {
            output += `  ❌ Lỗi khi tải quiz "${quiz.title}": ${e.message}\n`;
          }
        }
        output += `------------------------------------------------------------\n`;
      } catch (e) {
        output += `❌ Lỗi khi tải môn ID ${courseId}: ${e.message}\n`;
      }
    }

    resultEl.textContent = output || "✅ Không có quiz nào.";
  });
});

document.getElementById("exportZip").addEventListener("click", async () => {
  const output = resultEl.textContent.trim();
  if (!output) return alert("⚠️ Chưa có dữ liệu để xuất!");

  const zip = new JSZip();
  zip.file("quiz_deadlines.txt", output);

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quiz_deadlines.zip";
  a.click();

  URL.revokeObjectURL(url);
});

function addCourseToUI(courseData) {
  const li = document.createElement("li");
  const courseId = courseData.id || extractCourseId(courseData);
  li.innerHTML = `
    <span>📚 ID: ${courseId}</span>
    <button class="remove-btn" data-course-id="${courseId}">❌</button>
  `;
  courseList.appendChild(li);
}

// Add event delegation for remove buttons
courseList.addEventListener("click", (e) => {
  if (e.target.classList.contains("remove-btn")) {
    const courseId = e.target.getAttribute("data-course-id");
    removeCourse(e.target, courseId);
  }
});

function removeCourse(button, courseId) {
  chrome.storage.local.get("courses", (data) => {
    const courses = data.courses || [];
    const updatedCourses = courses.filter(course => {
      const id = course.id || extractCourseId(course);
      return id !== courseId;
    });
    chrome.storage.local.set({ courses: updatedCourses });
    button.parentElement.remove();
  });
}

function extractCourseId(url) {
  // Extract course ID from URL or return the input if it's already an ID
  if (url.includes('ref_id=')) {
    const match = url.match(/ref_id=(\d+)/);
    return match ? match[1] : url;
  }
  return url;
}
