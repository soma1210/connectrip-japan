import type { CSSProperties } from "react";
import styles from "./HomeOpeningExperience.module.css";

/**
 * Opening-only red-crowned crane (丹頂鶴) in flight, for Home Opening
 * Experience, refined toward the existing logo with an arched neck, long
 * trailing legs and a clearer red crown. Originally drawn for the animation from the Human storyboard (visual
 * reference only); it is NOT the official logo, which appears only in the header.
 *
 * Realistic silhouette × fine line art: warm ivory feather surfaces with navy secondary feathers
 * and fine champagne seams, a little champagne gold on the motion trail
 * and one wing accent, and a small muted red crown. viewBox 400 × 260, flying
 * to the right. Parts animate separately (see HomeOpeningExperience.module.css):
 * the illustration glides as one silhouette while the wings breathe.
 */
export function PremiumOpeningCrane({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 260" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="v1-crane-wing" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f5ead8" />
          <stop offset="1" stopColor="#cbb99c" />
        </linearGradient>
        <linearGradient id="v1-crane-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d2bfa0" />
          <stop offset="0.7" stopColor="#f3e6cf" />
          <stop offset="1" stopColor="#fff5e5" />
        </linearGradient>
      </defs>

      {/* Motion trail: the line of light the crane is born from. */}
      <path className={`${styles.draw} ${styles.trail}`} pathLength={1} d="M -360 220 C -170 236, 16 211, 150 170" />

      <path className={`${styles.draw} ${styles.trail} ${styles.trailSecondary}`} d="M -340 258 C -120 269, 47 218, 155 174" />

      {/* Rear (far) wing, lighter. */}
      <g className={`${styles.wing} ${styles.wingRear}`}>
        <path className={styles.fill} fill="url(#v1-crane-wing)" d="M 204 145 C 220 115, 206 110, 196 76 L 194 81 L 187 86 L 180 91 L 172 96 L 164 101 Q 157 108.1, 162 111.2 Q 155 118.4, 160 121.5 Q 153 128.6, 158 131.8 Q 151 138.9, 156 142 C 162 148, 190 149, 204 145 Z" />
        <g className={styles.feathers}>
          <path className={styles.feather} style={{ "--i": 0 } as CSSProperties} d="M 194 81 C 189.7 53, 167.4 28.8, 152 22 C 162.5 32.3, 182.3 58.2, 194 81 Z" />
          <path className={styles.feather} style={{ "--i": 1 } as CSSProperties} d="M 187 86 C 179.4 56.3, 153.1 32.1, 136 26 C 148.5 36, 172.5 62.1, 187 86 Z" />
          <path className={styles.feather} style={{ "--i": 2 } as CSSProperties} d="M 180 91 C 169.2 61.6, 140 39.6, 122 35 C 135.8 43.9, 162.9 68.1, 180 91 Z" />
          <path className={styles.feather} style={{ "--i": 3 } as CSSProperties} d="M 172 96 C 158.5 68.6, 127.9 50.5, 110 48 C 124.3 55.2, 153 75.7, 172 96 Z" />
          <path className={styles.feather} style={{ "--i": 4 } as CSSProperties} d="M 164 101 C 148.6 76.7, 118.1 63.2, 101 63 C 115 68.3, 143.9 84.4, 164 101 Z" />
        </g>
        <path className={styles.draw} pathLength={1} d="M 204 145 C 220 115, 206 110, 196 76" />
      </g>

      {/* Legs trailing behind, and the short tail. */}
      <path className={`${styles.draw} ${styles.fine}`} pathLength={1} d="M 150 170 C 123 182, 83 205, 37 221 L 27 221 M 37 221 L 29 227" />
      <path className={`${styles.draw} ${styles.fine}`} pathLength={1} d="M 155 174 C 123 191, 89 215, 48 233 L 38 233 M 48 233 L 41 239" />
      <path className={`${styles.draw} ${styles.fine}`} pathLength={1} d="M 131 166 C 121 162, 113 161, 105 162 M 132 170 C 122 172, 114 175, 107 178" />

      {/* Body and long neck as one silhouette; small head; long beak. */}
      <path className={styles.fill} fill="url(#v1-crane-body)" d="M 128 168 C 152 154, 204 141, 240 145 C 270 146, 282 139, 297 126 C 309 116, 313 107, 323 109 L 328 115 C 316 115, 312 127, 303 134 C 286 149, 277 157, 252 159 C 218 175, 160 181, 128 168 Z" />
      <path className={styles.draw} pathLength={1} d="M 128 168 C 152 154, 204 141, 240 145 C 270 146, 282 139, 297 126 C 309 116, 313 107, 323 109 L 328 115 C 316 115, 312 127, 303 134 C 286 149, 277 157, 252 159 C 218 175, 160 181, 128 168 Z" />
      <path
        className={styles.fill}
        fill="currentColor"
        d="M 321.5 115.5 C 323.5 110.5, 330.5 109, 335.5 111.2 C 337.8 113.2, 337 117, 333 118.6 C 328 120.2, 322.8 119.4, 321.5 115.5 Z M 335.2 111.6 L 368 103.6 L 336.2 116.6 Z"
      />
      <ellipse className={styles.crown} cx="328.4" cy="110.6" rx="4.8" ry="2.3" transform="rotate(-20 328.4 110.6)" />

      <circle className={styles.eye} cx="332" cy="114" r="1.1" />

      <path className={styles.bodyDetail} d="M 144 167 Q 191 174 234 157 M 159 162 Q 197 167 224 151" />

      {/* Front wing: arm with scalloped secondaries, six long primaries. */}
      <g className={`${styles.wing} ${styles.wingFront}`}>
        <path className={styles.fill} fill="url(#v1-crane-wing)" d="M 218 146 C 234 116, 250 100, 240 66 L 239 71 L 233 78 L 226 85 L 218 92 L 210 99 L 201 106 Q 191.6 111.7, 194.2 113.3 Q 184.8 119, 187.3 120.7 Q 177.9 126.3, 180.5 128 Q 171.1 133.7, 173.7 135.3 Q 164.2 141, 166.8 142.7 Q 157.4 148.3, 160 150 C 166 156, 204 150, 218 146 Z" />
        <g className={styles.feathers}>
          <path className={styles.feather} style={{ "--i": 0 } as CSSProperties} d="M 239 71 C 249.2 48.2, 242 21.2, 232 10 C 224 30, 223 54, 239 71 Z" />
          <path className={styles.feather} style={{ "--i": 1 } as CSSProperties} d="M 233 78 C 240 49.2, 227.1 18, 214 6 C 209 32, 214 60, 233 78 Z" />
          <path className={styles.feather} style={{ "--i": 2 } as CSSProperties} d="M 226 85 C 229 53.9, 211.2 22.8, 196 12 C 194 39, 201 66, 226 85 Z" />
          <path className={styles.feather} style={{ "--i": 3 } as CSSProperties} d="M 218 92 C 217.6 60.5, 196.4 31.2, 180 22 C 178 48, 189 73, 218 92 Z" />
          <path className={styles.feather} style={{ "--i": 4 } as CSSProperties} d="M 210 99 C 206.4 68.7, 182.8 43, 166 36 C 165 60, 177 83, 210 99 Z" />
          <path className={styles.feather} style={{ "--i": 5 } as CSSProperties} d="M 201 106 C 194.7 78.6, 170.3 58.2, 154 54 C 152 73, 166 95, 201 106 Z" />
        </g>
        <path className={styles.secondary} d="M 218 146 Q 238 118 235 90 Q 211 93 201 106 Q 185 125 160 150 Q 189 153 218 146 Z" />
        <path className={styles.bodyDetail} d="M 231 101 Q 205 105 181 137 M 228 111 Q 206 116 176 144 M 222 123 Q 206 128 184 147" />
        <path className={styles.draw} pathLength={1} d="M 218 146 C 234 116, 250 100, 240 66" />
        <path className={`${styles.draw} ${styles.fine}`} pathLength={1} d="M 201 106 Q 191.6 111.7, 194.2 113.3 Q 184.8 119, 187.3 120.7 Q 177.9 126.3, 180.5 128 Q 171.1 133.7, 173.7 135.3 Q 164.2 141, 166.8 142.7 Q 157.4 148.3, 160 150" />
        <path className={`${styles.draw} ${styles.accent}`} pathLength={1} d="M 232 104 C 214 100, 194 104, 176 114" />
      </g>
    </svg>
  );
}
