import type { SVGProps } from 'react';
import * as React from 'react';
interface SVGRProps {
  title?: string;
  titleId?: string;
}
const SpireKeyKdacolorLight = (
  { title, titleId, ...props }: SVGProps<SVGSVGElement> & SVGRProps,
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    data-style="kdacolor"
    viewBox="0 0 193 64"
    fontSize="1.5em"
    height="1em"
    aria-labelledby={titleId}
    {...props}
  >
    {title ? <title id={titleId}>{title}</title> : null}
    <path
      fill="#4A9079"
      d="m31.504 42.997 4.67 2.312-3.657 2.658zM43.33 40.11l-12.713-1.468-.637-3.13h11.856zM15.156 45.309l4.677-2.312-1 4.984zM20.707 38.642 8 40.11l1.494-4.598h11.84z"
    />
    <path
      fill="#4A9079"
      d="m39.422 28.082-9.442 7.43-4.323-1.486-4.323 1.486-9.429-7.422 1.412-4.345 7.383 4.96 2.752 5.079v-14.44h4.41v14.033l2.752-4.672 7.397-4.965z"
    />
    <path
      fill="#0F0F0F"
      d="M50.162 15.931v-5.404h.827v2.246h.128q.504-.557 2.008-2.246h1.083q-.608.672-2.43 2.66.633.686 2.52 2.744h-1.12q-.511-.573-2.06-2.291h-.128v2.291zM54.523 15.931l1.534-5.404h1.467l1.534 5.404H58.2q-.09-.316-.353-1.274h-2.113q-.083.315-.354 1.274zm1.422-2.042h1.692q-.196-.716-.781-2.841h-.128l-.782 2.84zM59.585 15.931v-5.404h2.158q1.075 0 1.647.55.58.55.58 1.65v1.01q0 1.109-.58 1.65-.57.543-1.647.543h-2.158zm.842-.753h1.324q.698 0 1.038-.355.338-.36.338-1.062v-1.063q0-.71-.338-1.056t-1.038-.347h-1.324zM64.909 15.931v-5.404H68.3v.762h-2.564v1.545h2.355v.761h-2.355v1.583h2.602v.754H64.91M69.211 15.931v-5.404h1.602q.36 1.215 1.46 4.846h.127v-4.846h.82v5.404h-1.602q-.361-1.213-1.46-4.854h-.127v4.854zM73.948 15.931l1.534-5.404h1.466l1.534 5.404h-.857q-.09-.316-.354-1.274H75.16q-.083.315-.354 1.274zm1.42-2.042h1.693q-.195-.716-.782-2.841h-.127l-.782 2.84zM57.672 44.921q-2.592 0-4.576-.928t-3.104-2.656-1.12-4.16v-.896h4.16v.896q0 2.016 1.248 3.04 1.247.992 3.392.992 2.176 0 3.232-.864 1.088-.864 1.088-2.208 0-.928-.544-1.504-.513-.576-1.536-.928-.992-.384-2.432-.704l-.736-.16q-2.304-.512-3.968-1.28-1.631-.8-2.528-2.08-.864-1.28-.864-3.328t.96-3.488q.991-1.472 2.752-2.24 1.792-.8 4.192-.8t4.256.832q1.888.8 2.944 2.432 1.088 1.6 1.088 4.032v.96h-4.16v-.96q0-1.28-.512-2.048-.48-.8-1.408-1.152-.928-.384-2.208-.384-1.92 0-2.848.736-.896.704-.896 1.952 0 .832.416 1.408.448.576 1.312.96t2.208.672l.736.16q2.4.512 4.16 1.312 1.792.8 2.784 2.112t.992 3.36-1.056 3.616q-1.024 1.536-2.944 2.432-1.888.864-4.48.864m11.758 5.952V28.601h3.968v1.92h.576q.544-.928 1.696-1.632 1.152-.735 3.296-.736 1.92 0 3.552.96 1.632.928 2.624 2.752t.992 4.416v.512q0 2.592-.992 4.416t-2.624 2.784a7.06 7.06 0 0 1-3.552.928q-1.44 0-2.432-.352-.96-.32-1.568-.832a6 6 0 0 1-.928-1.088h-.576v8.224zm8.32-9.472q1.888 0 3.104-1.184 1.248-1.216 1.248-3.52v-.32q0-2.304-1.248-3.488-1.248-1.216-3.104-1.216t-3.104 1.216q-1.248 1.184-1.248 3.488v.32q0 2.304 1.248 3.52 1.248 1.185 3.104 1.184m12.086 3.072V28.601h4.032v15.872zm2.016-17.728q-1.088 0-1.856-.704-.736-.704-.736-1.856t.736-1.856q.768-.705 1.856-.704 1.12 0 1.856.704t.736 1.856-.736 1.856q-.735.704-1.856.704m6.484 17.728V28.601h3.968v1.792h.576q.352-.96 1.152-1.408.833-.448 1.92-.448h1.92v3.584h-1.984q-1.536 0-2.528.832-.992.8-.992 2.496v9.024zm19.357.448q-2.367 0-4.192-.992a7.4 7.4 0 0 1-2.816-2.848q-.992-1.856-.992-4.352v-.384q0-2.496.992-4.32.993-1.856 2.784-2.848 1.793-1.024 4.16-1.024 2.337 0 4.064 1.056 1.728 1.024 2.688 2.88.96 1.824.96 4.256v1.376h-11.552q.064 1.632 1.216 2.656t2.816 1.024q1.696 0 2.496-.736a5.2 5.2 0 0 0 1.216-1.632l3.296 1.728q-.448.832-1.312 1.824-.831.96-2.24 1.664-1.407.672-3.584.672m-3.872-10.208h7.424q-.127-1.375-1.12-2.208-.96-.832-2.528-.832-1.632 0-2.592.832t-1.184 2.208m14.981 9.76v-22.4h4.224v8.896h.576l7.264-8.896h5.408l-9.344 11.04 9.664 11.36h-5.568l-7.424-9.088h-.576v9.088zm26.923.448q-2.368 0-4.192-.992a7.37 7.37 0 0 1-2.816-2.848q-.993-1.856-.992-4.352v-.384q0-2.496.992-4.32.992-1.856 2.784-2.848 1.791-1.024 4.16-1.024 2.336 0 4.064 1.056 1.728 1.024 2.688 2.88.96 1.824.96 4.256v1.376h-11.552q.064 1.632 1.216 2.656t2.816 1.024q1.695 0 2.496-.736a5.2 5.2 0 0 0 1.216-1.632l3.296 1.728q-.448.832-1.312 1.824-.833.96-2.24 1.664-1.409.672-3.584.672m-3.872-10.208h7.424q-.129-1.375-1.12-2.208-.96-.832-2.528-.832-1.632 0-2.592.832t-1.184 2.208m16.836 16.16v-3.52h8.64q.897 0 .896-.96v-4h-.576q-.255.544-.8 1.088-.543.544-1.472.896t-2.368.352q-1.855 0-3.264-.832a5.9 5.9 0 0 1-2.144-2.368q-.768-1.505-.768-3.456v-9.472h4.032v9.152q0 1.792.864 2.688.897.896 2.528.896 1.857 0 2.88-1.216 1.024-1.248 1.024-3.456v-8.064h4.032v18.688q0 1.632-.96 2.592-.96.992-2.56.992z"
    />
  </svg>
);
export default SpireKeyKdacolorLight;