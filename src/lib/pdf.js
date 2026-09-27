// jsPDF reorders a custom [w, h] page format to match `orientation` (default "p" = portrait),
// silently swapping width/height when the content is landscape. Pass orientation explicitly,
// computed from the actual capture size, or the page and the image end up mismatched.
export const pdfOrientation = (width, height) => (width >= height ? 'l' : 'p')

// html2canvas snapshots the DOM as soon as it's called - it does not wait for <img> tags
// still loading (e.g. a Supabase signed URL fetched over the network) to finish. Race that
// and the photo comes out blank/broken in the PDF even though it renders fine on screen a
// moment later. Call this right before html2canvas so every image is decoded first.
export const waitForImages = (root) => Promise.all(
  Array.from(root.querySelectorAll('img')).map((img) => (
    img.complete && img.naturalWidth > 0
      ? Promise.resolve()
      : new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true })
        img.addEventListener('error', resolve, { once: true })
      })
  )),
)
