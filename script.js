// ===============================
// 🔢 تحويل أكواد الإحداثيات إلى X,Y
// ===============================
function decodePathCodes(pathData) {

  if (!pathData) return "";

  // إذا كان المسار بصيغة SVG القديمة، نخليه كما هو
  if (/[ML]/i.test(pathData)) {
    return pathData;
  }

  // فصل الأكواد بالمسافات
  const codes = pathData
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!codes.length) return "";

  const points = codes.map(code => {

    // الكود لازم يكون 7 أرقام
    if (!/^\d{7}$/.test(code)) {
      console.warn("كود غير صحيح:", code);
      return null;
    }

    // أول 3 أرقام = X
    const x = parseInt(code.substring(0, 3), 10);

    // آخر 4 أرقام = Y
    const y = parseInt(code.substring(3, 7), 10);

    return { x, y };
  });

  // إذا فيه كود غير صحيح
  if (points.some(point => point === null)) {
    return "";
  }

  // تحويل النقاط إلى SVG Path
  return points
    .map((point, index) => {
      return `${index === 0 ? "M" : "L"}${point.x},${point.y}`;
    })
    .join(" ");
}


// ===============================
// 🔍 البحث
// ===============================
async function searchLocation() {

  let input = document.getElementById("search").value.trim();

  // إذا البحث فاضي
  if (!input) {

    document.getElementById("result").innerText =
      "اكتب رقم القاعة أولاً";

    document.getElementById("floor-highlight").style.display = "none";

    document.getElementById("destination-dot").style.display = "none";

    document.getElementById("route-path").setAttribute("d", "");

    document.querySelectorAll(".floor-labels span").forEach(el => {
      el.classList.remove("active");
    });

    return;
  }

  try {

    let response = await fetch(
      `/search?q=${encodeURIComponent(input)}`
    );

    let data = await response.json();

    console.log("DATA:", data);

    // ===============================
    // ❌ لا توجد نتيجة
    // ===============================
    if (data.error) {

      document.getElementById("result").innerText =
        "الموقع غير موجود";

      document.getElementById("floor-highlight").style.display = "none";

      document.getElementById("destination-dot").style.display = "none";

      document.getElementById("route-path").setAttribute("d", "");

      document.querySelectorAll(".floor-labels span").forEach(el => {
        el.classList.remove("active");
      });

      return;
    }


    // ===============================
    // 📋 عرض النتيجة
    // ===============================
    document.getElementById("result").innerText =
      `${data.name} - ${data.description}`;


    // ===============================
    // 🗺️ رسم المسار
    // ===============================
 let path = document.getElementById("route-path");
let flowTimer = null; // لتفادي تراكم المؤقتات عند تكرار البحث

if (data.location_path) {

  // إيقاف أي نمط تدفق سابق قبل رسم مسار جديد
  clearTimeout(flowTimer);
  path.classList.remove("route-flow");

  // تحويل CODE إلى X,Y إذا كان المسار بالأكواد
  // وإذا كان المسار قديمًا، سيتم استخدامه كما هو
  const decodedPath = decodePathCodes(data.location_path);
  path.setAttribute("d", decodedPath);

  // احسب طول المسار
  const length = path.getTotalLength();

  // إعادة ضبط الأنيميشن (رسم تدريجي للمسار من البداية)
  path.style.transition = "none";
  path.style.strokeDasharray = length;
  path.style.strokeDashoffset = length;

  // إجبار المتصفح على إعادة الحساب قبل بدء الحركة
  path.getBoundingClientRect();

  // تشغيل أنيميشن الرسم بمنحنى حركة أنعم من الخطي
  path.style.transition = "stroke-dashoffset 1.4s cubic-bezier(0.65, 0, 0.35, 1)";
  requestAnimationFrame(() => {
    path.style.strokeDashoffset = 0;
  });

  // بعد اكتمال رسم المسار: تفعيل نمط تدفق خفيف ومستمر
  // يوحي باتجاه السير نحو الوجهة (تُتحكم به عبر كلاس route-flow في CSS)
  flowTimer = setTimeout(() => {
    path.style.strokeDasharray = "";
    path.classList.add("route-flow");
  }, 1450);

} else {
  clearTimeout(flowTimer);
  path.classList.remove("route-flow");
  path.setAttribute("d", "");
}


    // ===============================
    // 📍 نقطة الوجهة
    // ===============================
    let dot =
      document.getElementById("destination-dot");

    if (
      data.location_x !== null &&
      data.location_x !== undefined &&
      data.location_y !== null &&
      data.location_y !== undefined
    ) {

      dot.setAttribute(
        "cx",
        data.location_x
      );

      dot.setAttribute(
        "cy",
        data.location_y
      );

      dot.style.display = "block";

    } else {

      dot.style.display = "none";

    }


    // ===============================
    // 🏢 تحديد الدور
    // ===============================
    highlightFloor(data.floor);

  }

  catch (error) {

    console.log("ERROR:", error);

    document.getElementById("result").innerText =
      "فيه مشكلة في الاتصال";

    document.getElementById("floor-highlight").style.display =
      "none";

    document.getElementById("destination-dot").style.display =
      "none";

    document.getElementById("route-path").setAttribute(
      "d",
      ""
    );

    document.querySelectorAll(".floor-labels span").forEach(el => {
      el.classList.remove("active");
    });

  }
}


// ===============================
// ⚡ أزرار الاختصار
// ===============================
function quickSearch(value) {

  document.getElementById("search").value = value;

  searchLocation();

}


// ===============================
// 🖱️ التقاط الإحداثيات عند الضغط
// ===============================
const map =
  document.getElementById("map-svg");

if (map) {

  map.addEventListener("click", function (e) {

    const rect =
      map.getBoundingClientRect();

    const x = Math.round(
      ((e.clientX - rect.left) / rect.width) * 820
    );

    const y = Math.round(
      ((e.clientY - rect.top) / rect.height) * 1200
    );


    // ===============================
    // 🔢 تحويل X + Y إلى كود واحد
    // ===============================
    const code =
      String(x).padStart(3, "0") +
      String(y).padStart(4, "0");


    console.log(
      `X: ${x} | Y: ${y} | CODE: ${code}`
    );

    alert(
      `X: ${x}\nY: ${y}\nCODE: ${code}`
    );

  });

}


// ===============================
// 🏢 هايلايت الدور
// ===============================
function highlightFloor(floor) {

  console.log("FLOOR:", floor);

  let highlight =
    document.getElementById("floor-highlight");

  if (!highlight) return;


  // تنظيف القيمة
  floor = String(floor)
    .trim()
    .toUpperCase();


  // ===============================
  // 📍 مواقع الهايلايت
  // ===============================
  const positions = {

    S: 426,

    G: 338,

    1: 260,

    2: 180,

    3: 110

  };


  // إذا الدور غير موجود
  if (positions[floor] === undefined) {

    highlight.style.display = "none";

    document
      .querySelectorAll(".floor-labels span")
      .forEach(el => {

        el.classList.remove("active");

      });

    return;
  }


  // ===============================
  // 🔴 إظهار الهايلايت
  // ===============================
  highlight.style.top =
    positions[floor] + "px";

  highlight.style.display = "block";


  // ===============================
  // 🔢 تفعيل رقم الدور
  // ===============================
  document
    .querySelectorAll(".floor-labels span")
    .forEach(el => {

      el.classList.remove("active");

    });


  let active =
    document.querySelector(
      `[data-floor="${floor}"]`
    );


  if (active) {

    active.classList.add("active");

  }

}


// ===============================
// ❌ لم نعد نحتاج استخراج الدور
// من رقم القاعة
// ===============================
//
// أصبح الدور يأتي مباشرة من قاعدة البيانات.
//
// أبقيت الدالة هنا فقط حتى لا نحذفها
// إذا احتجناها مستقبلًا.
//
function getFloorFromRoom(room) {

  let match =
    room.match(/B\d([0-9G])/i);

  if (!match) return null;

  return match[1].toUpperCase();

}