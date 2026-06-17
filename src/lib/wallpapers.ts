export const WALLPAPERS = [
  {
    id: 'forest-default',
    label: 'Forest canopy',
    cssUrl: "url('/wallpaper.jpg')",
  },
  {
    id: 'forest-aerial',
    label: 'Aerial forest',
    cssUrl: "url('/wallpaper-1.jpg')",
  },
  {
    id: 'forest-path',
    label: 'Forest path',
    cssUrl: "url('/wallpaper-2.jpg')",
  },
  {
    id: 'forest-topdown',
    label: 'Forest top-down',
    cssUrl: "url('/wallpaper-3.jpg')",
  },
] as const

export type WallpaperId = (typeof WALLPAPERS)[number]['id']
