import { useEffect } from "react";
import React from "react";
const AD_UNIT_PATH = "/6355419/Travel/Europe";

export function GoogleTestAd({ placement }) {
  useEffect(() => {
    let slot = null;
    let cancelled = false;

    // GPT command queue
    window.googletag = window.googletag || { cmd: [] };

    window.googletag.cmd.push(() => {
      if (cancelled) return;

      const googletag = window.googletag;
      const divId = `blogspace-${placement}`;

      // Responsive sizes for desktop, tablet and mobile
      const sizeMapping = googletag
        .sizeMapping()
        .addSize(
          [1000, 0],
          [
            [970, 250],
            [728, 90],
            [300, 250],
          ]
        )
        .addSize(
          [650, 0],
          [
            [728, 90],
            [336, 280],
            [300, 250],
          ]
        )
        .addSize(
          [0, 0],
          [
            [336, 280],
            [300, 250],
          ]
        )
        .build();

      slot = googletag
        .defineSlot(
          AD_UNIT_PATH,
          [
            [970, 250],
            [728, 90],
            [336, 280],
            [300, 250],
          ],
          divId
        )
        .defineSizeMapping(sizeMapping)
        .addService(googletag.pubads());

      // Enable GPT services only once
      if (!window.__blogspaceGPTEnabled) {
        googletag.pubads().enableSingleRequest();
        googletag.enableServices();
        window.__blogspaceGPTEnabled = true;
      }

      googletag.display(divId);
    });

    return () => {
      cancelled = true;

      if (slot && window.googletag?.apiReady) {
        window.googletag.destroySlots([slot]);
      }
    };
  }, [placement]);

  return (
    <div className="google-test-ad">
      <div className="google-test-ad-label">
        Advertisement · Google Test Ad
      </div>

      <div
        id={`blogspace-${placement}`}
        className="google-test-ad-slot"
      />
    </div>
  );
}
