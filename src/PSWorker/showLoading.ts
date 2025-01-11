export function showLoading(show: boolean) {
  const img = document.querySelector(".loading") as HTMLImageElement;
  img.style.visibility = show ? "visible" : "hidden";
}
