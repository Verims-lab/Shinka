import { Flower2, Moon, Sun } from "lucide-react";
import ShinkaButton from "@/components/shinka/ShinkaButton";

// ON-01 body: three introduction rows shown together on first render (no carousel).
const ROWS = [
  { icon: Flower2, title: "introCycle", text: "introCycleText" },
  { icon: Moon, title: "introMoon", text: "introMoonText" },
  { icon: Sun, title: "birthChart", text: "introChartText" },
];

export default function OnboardingIntro({ t, onBegin }) {
  return (
    <div className="space-y-2" data-onboarding-intro>
      <p className="text-center text-shinka-body text-shinka-taupe">{t("introBody")}</p>
      <ul className="space-y-2">
        {ROWS.map(({ icon: Icon, title, text }) => (
          <li
            key={title}
            data-intro-row={title}
            className="flex items-center gap-2 rounded-2xl border border-shinka-line px-2 py-1"
            style={{ backgroundColor: "rgb(var(--shinka-white) / .8)" }}
          >
            <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-shinka-blush">
              <Icon className="h-5 w-5 text-shinka-plum" />
            </span>
            <span className="min-w-0">
              <span className="block font-heading text-shinka-h4 text-shinka-plum-deep">{t(title)}</span>
              <span data-intro-description className="block break-words text-shinka-taupe" style={{ fontSize: "85%", lineHeight: 1.4 }}>{t(text)}</span>
            </span>
          </li>
        ))}
      </ul>
      <ShinkaButton className="w-full" onClick={onBegin}>{t("begin")}</ShinkaButton>
    </div>
  );
}
