import { MapPin } from 'lucide-react';

/**
 * Naver Maps placeholder.
 * 실제 SDK 연동:
 *   - public/script 로 Naver Maps API 로드
 *   - NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 필요
 *   - 추후 NaverMap.tsx 로 교체
 */
type Props = {
  height?: number;
  caption?: string;
  markers?: { lat: number; lng: number; label?: string }[];
};

export function NaverMapStub({ height = 320, caption, markers }: Props) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-brand-bg text-sm text-muted-foreground"
      style={{ height }}
    >
      <MapPin className="h-6 w-6 text-brand-primary/40" />
      <p className="font-medium text-brand-primary/60">지도 영역</p>
      {caption && <p className="text-xs">{caption}</p>}
      {markers && markers.length > 0 && (
        <p className="text-xs">마커 {markers.length}개 (준비중)</p>
      )}
      <p className="text-xs">NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 설정 후 활성화</p>
    </div>
  );
}
