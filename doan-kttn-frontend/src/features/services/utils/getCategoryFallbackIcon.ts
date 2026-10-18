import {
  Zap,
  Droplet,
  Wind,
  Refrigerator,
  Trees,
  Hammer,
  Sparkles,
  Layers,
  type LucideIcon,
} from 'lucide-react';

/**
 * Hàm lấy icon biểu trưng dự phòng cho ngành nghề theo tên
 */
export function getCategoryFallbackIcon(name = ''): LucideIcon {
  const text = name.toLowerCase();
  if (text.includes('điện') && !text.includes('lạnh')) return Zap;
  if (text.includes('nước') || text.includes('ống')) return Droplet;
  if (text.includes('lạnh') || text.includes('điều hòa') || text.includes('giặt')) return Wind;
  if (text.includes('tủ lạnh') || text.includes('thiết bị')) return Refrigerator;
  if (text.includes('vườn') || text.includes('cây')) return Trees;
  if (text.includes('nội thất') || text.includes('bàn') || text.includes('kệ')) return Hammer;
  if (text.includes('dọn dẹp') || text.includes('vệ sinh')) return Sparkles;
  return Layers;
}
