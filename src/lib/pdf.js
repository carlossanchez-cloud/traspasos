// jsPDF reorders a custom [w, h] page format to match `orientation` (default "p" = portrait),
// silently swapping width/height when the content is landscape. Pass orientation explicitly,
// computed from the actual capture size, or the page and the image end up mismatched.
export const pdfOrientation = (width, height) => (width >= height ? 'l' : 'p')
