async function searchLocation() {
  let input = document.getElementById("search").value.trim();

  if (!input) {
    document.getElementById("result").innerText = "اكتب رقم القاعة أولاً";
    return;
  }

  try {
    let response = await fetch(`http://localhost:3000/search?q=${input}`);
    let result = await response.text();

    document.getElementById("result").innerText = result;

  } catch (error) {
    document.getElementById("result").innerText = "تأكد أن السيرفر شغال";
  }
}