type P = { size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const IconHeart = ({ size = 24 }: P) => (
  <svg {...base(size)}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
);
export const IconDownload = ({ size = 24 }: P) => (
  <svg {...base(size)}><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
);
export const IconMusic = ({ size = 24 }: P) => (
  <svg {...base(size)}><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
);
export const IconShare = ({ size = 22 }: P) => (
  <svg {...base(size)}><path d="M22 2 11 13" /><path d="m22 2-7 20-4-9-9-4Z" /></svg>
);
export const IconSearch = ({ size = 22 }: P) => (
  <svg {...base(size)}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
);
export const IconGrid = ({ size = 22 }: P) => (
  <svg {...base(size)}><rect x="3" y="3" width="7" height="9" rx="2" /><rect x="14" y="3" width="7" height="5" rx="2" /><rect x="14" y="12" width="7" height="9" rx="2" /><rect x="3" y="16" width="7" height="5" rx="2" /></svg>
);
export const IconPlus = ({ size = 22 }: P) => (
  <svg {...base(size)} strokeWidth={2.6}><path d="M12 5v14" /><path d="M5 12h14" /></svg>
);
export const IconUser = ({ size = 22 }: P) => (
  <svg {...base(size)}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
);
export const IconFilter = ({ size = 22 }: P) => (
  <svg {...base(size)}><path d="M4 6h16" /><path d="M7 12h10" /><path d="M10 18h4" /></svg>
);
export const IconBack = ({ size = 20 }: P) => (
  <svg {...base(size)}><path d="m15 18-6-6 6-6" /></svg>
);
export const IconClose = ({ size = 20 }: P) => (
  <svg {...base(size)}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
);
export const IconBookmark = ({ size = 20 }: P) => (
  <svg {...base(size)}><path d="M19 21 12 16 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" /></svg>
);
export const IconUpload = ({ size = 26 }: P) => (
  <svg {...base(size)} strokeWidth={2.4}><path d="M12 19V7" /><path d="m7 12 5-5 5 5" /></svg>
);
export const IconUp = ({ size = 14 }: P) => (
  <svg {...base(size)}><path d="m18 15-6-6-6 6" /></svg>
);
