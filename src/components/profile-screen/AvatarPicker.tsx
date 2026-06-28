import avatarsSvgUrl from '../../assets/avatars.svg?url';

const AVATAR_COORDS: [number, number][] = [
  [59, 60],
  [163, 60],
  [267, 60],
  [370, 60],
  [59, 162],
  [163, 162],
  [267, 162],
  [370, 162],
  [59, 263],
  [163, 263],
  [267, 263],
  [370, 263],
  [59, 365],
  [163, 365],
  [267, 365],
  [370, 365],
];

const HALF = 54;

interface AvatarProps {
  index: number;
  size?: number;
}

export function Avatar({ index, size = 64 }: AvatarProps) {
  const [cx, cy] = AVATAR_COORDS[index] ?? AVATAR_COORDS[0];
  const vx = cx - HALF;
  const vy = cy - HALF;
  const vSize = HALF * 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`${vx} ${vy} ${vSize} ${vSize}`}
      xmlns="http://www.w3.org/2000/svg"
      style="overflow: hidden"
    >
      <image
        href={avatarsSvgUrl}
        x="0"
        y="0"
        width="430"
        height="430"
      />
    </svg>
  );
}

interface AvatarPickerProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function AvatarPicker({ selectedIndex, onSelect }: AvatarPickerProps) {
  return (
    <div class="flex flex-wrap gap-2">
      {AVATAR_COORDS.map((_, i) => (
        <button
          key={i}
          class={`bg-bg border-2 rounded-md cursor-pointer flex items-center justify-center transition-[border-color,background] duration-(--transition-fast) p-0.5 overflow-hidden w-fit ${selectedIndex === i ? 'border-primary bg-primary-light' : 'border-border hover:border-primary hover:bg-primary-light'}`}
          onClick={() => onSelect(i)}
          aria-label={`Avatar ${i + 1}`}
        >
          <Avatar index={i} size={52} />
        </button>
      ))}
    </div>
  );
}
