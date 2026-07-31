import { useEffect, useState } from "react";
import {
  UI_SCALE_MAX,
  UI_SCALE_MIN,
  UI_SCALE_STEP,
  useSettingsStore,
  VIDEO_SYNC_SLIDER_MAX,
  VIDEO_SYNC_SLIDER_MIN,
  VIDEO_SYNC_SLIDER_STEP,
} from "../../store/useSettingsStore";
import { useWindowLayoutStore } from "../../store/useWindowLayoutStore";

const BUTTON_STYLE: React.CSSProperties = {
  color: "#c8a020",
  background: "rgba(0,0,0,0.7)",
  border: "3px solid #9a7228",
  padding: "2px 8px",
  lineHeight: 1.4,
};

export const SettingsPage: React.FC = () => {
  const videoSyncOffset = useSettingsStore((state) => state.videoSyncOffset);
  const setVideoSyncOffset = useSettingsStore((state) => state.setVideoSyncOffset);
  const resetVideoSyncOffset = useSettingsStore((state) => state.resetVideoSyncOffset);
  const uiScale = useSettingsStore((state) => state.uiScale);
  const setUiScale = useSettingsStore((state) => state.setUiScale);
  const resetUiScale = useSettingsStore((state) => state.resetUiScale);
  const resetWindowLayout = useWindowLayoutStore((state) => state.resetLayout);
  const windowPositions = useWindowLayoutStore((state) => state.positions);
  const autoPlaced = useWindowLayoutStore((state) => state.autoPlaced);
  const hasMovedWindows = Object.keys(windowPositions).some(
    (id) => !autoPlaced.includes(id as (typeof autoPlaced)[number])
  );

  // The text field keeps its own draft so half-typed values ("", "-", "-3")
  // don't get normalized away while the user is still typing.
  const [draft, setDraft] = useState(String(videoSyncOffset));

  useEffect(() => {
    if (Number(draft) !== videoSyncOffset) setDraft(String(videoSyncOffset));
    // Only resync when the value changed outside the text field (slider, reset).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoSyncOffset]);

  const handleDraftChange = (value: string) => {
    setDraft(value);
    const parsed = Number(value);
    if (value.trim() !== "" && Number.isFinite(parsed)) {
      setVideoSyncOffset(parsed);
    }
  };

  const handleDraftBlur = () => {
    // Snap the field back to the committed value if they left it unusable.
    setDraft(String(videoSyncOffset));
  };

  const sliderValue = Math.min(
    VIDEO_SYNC_SLIDER_MAX,
    Math.max(VIDEO_SYNC_SLIDER_MIN, videoSyncOffset)
  );
  const beyondSlider = videoSyncOffset !== sliderValue;

  return (
    <div className="flex flex-col gap-4 pr-2 text-xs">
      <h2 className="text-sm" style={{ color: "#c8a020" }}>
        Settings
      </h2>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="video-sync-offset">Video Sync</label>
          <div className="flex items-center gap-1">
            <input
              id="video-sync-offset-input"
              type="number"
              step={VIDEO_SYNC_SLIDER_STEP}
              value={draft}
              onChange={(e) => handleDraftChange(e.target.value)}
              onBlur={handleDraftBlur}
              className="w-20 text-right"
              style={{
                color: "#c8a020",
                background: "rgba(0,0,0,0.7)",
                border: "3px solid #9a7228",
                padding: "1px 4px",
              }}
            />
            <span style={{ color: "#a89070" }}>ms</span>
          </div>
        </div>

        <input
          id="video-sync-offset"
          type="range"
          min={VIDEO_SYNC_SLIDER_MIN}
          max={VIDEO_SYNC_SLIDER_MAX}
          step={VIDEO_SYNC_SLIDER_STEP}
          value={sliderValue}
          onChange={(e) => setVideoSyncOffset(Number(e.target.value))}
          className="w-full cursor-pointer accent-yellow-600"
        />

        <div className="flex justify-between" style={{ color: "#8a7048" }}>
          <span>earlier</span>
          <span>later</span>
        </div>

        <p style={{ color: "#a89070" }}>
          Fine-tune how well the game lines up with the video you see. If the game
          reacts before it happens on stream, move the slider right. If it reacts
          too late, move it left.
        </p>

        {beyondSlider && (
          <p style={{ color: "#8a7048" }}>
            Your value is past the end of the slider — moving the slider will pull
            it back into range.
          </p>
        )}

        <button
          onClick={resetVideoSyncOffset}
          disabled={videoSyncOffset === 0}
          className="self-start cursor-pointer disabled:cursor-default disabled:opacity-40"
          style={BUTTON_STYLE}
        >
          Reset
        </button>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="ui-scale">UI Size</label>
          <span style={{ color: "#c8a020" }}>{Math.round(uiScale * 100)}%</span>
        </div>

        <input
          id="ui-scale"
          type="range"
          min={UI_SCALE_MIN}
          max={UI_SCALE_MAX}
          step={UI_SCALE_STEP}
          value={uiScale}
          onChange={(e) => setUiScale(Number(e.target.value))}
          className="w-full cursor-pointer accent-yellow-600"
        />

        <p style={{ color: "#a89070" }}>
          The interface already resizes with the stream, so it takes up the same
          share of the picture in fullscreen as it does with chat open. Use this
          if you want it chunkier or want to see more of the world.
        </p>

        <button
          onClick={resetUiScale}
          disabled={uiScale === 1}
          className="self-start cursor-pointer disabled:cursor-default disabled:opacity-40"
          style={BUTTON_STYLE}
        >
          Reset
        </button>
      </section>

      <section className="flex flex-col gap-2">
        <span style={{ color: "#c8a020" }}>Windows</span>

        <p style={{ color: "#a89070" }}>
          Drag a window by its title bar to move it anywhere on the stream.
          Where you drop it is remembered on this device.
        </p>

        <button
          onClick={resetWindowLayout}
          disabled={!hasMovedWindows}
          className="self-start cursor-pointer disabled:cursor-default disabled:opacity-40"
          style={BUTTON_STYLE}
        >
          Reset window positions
        </button>
      </section>
    </div>
  );
};
