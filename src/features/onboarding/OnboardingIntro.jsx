import { Flower2, Moon, Sun } from "lucide-react";
import ShinkaButton from "@/components/shinka/ShinkaButton";

// ON-01 body: three introduction rows shown together on first render (no carousel).
export const INTRO_ART =
  "https://media.base44.com/images/public/6ad5190f4845d4e3af03b420/4a0b6c46b_generated_image.png";
const ROWS = [
  { icon: Flower2, title: "introCycle", text: "introCycleText" },
  { icon: Moon, title: "introMoon", text: "introMoonText" },
  { icon: Sun, title: "birthChart", text: "introChartText" },
];

export function IntroArt() {
  return (
    <img
      src={INTRO_ART}
      alt=""
      aria-hidden="true"
      width="512"
      height="512"
      decoding="async"
      className="shinka-intro-art mx-auto h-auto w-full max-w-[240px]"
    />
  );
}

export default function OnboardingIntro({ t, onBegin }) {
  return (
    <div className="space-y-5" data-onboarding-intro>
      <p className="text-center text-shinka-taupe">{t("introBody")}</p>
      <ul className="space-y-3">
        {ROWS.map(({ icon: Icon, title, text }) => (
          <li key={title} data-intro-row={title} className="flex items-center gap-4 rounded-2xl border border-shinka-line bg-shinka-white/80 p-4">
            <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-shinka-blush">
              <Icon className="h-6 w-6 text-shinka-plum" />
            </span>
            <span className="min-w-0">
              <span className="block font-heading text-shinka-h3 text-shinka-plum-deep">{t(title)}</span>
              <span className="block break-words text-shinka-small text-shinka-taupe">{t(text)}</span>
            </span>
          </li>
        ))}
      </ul>
      <ShinkaButton className="w-full" onClick={onBegin}>{t("begin")}</ShinkaButton>
    </div>
  );
}