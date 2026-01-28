import styles from "./Section.module.scss";
import {LogoSection} from "./Logo";
import {MenuSec} from "./Menu";
import React, {FC, ReactNode} from "react";
import {TReadyAppState} from "../types";
import {SectionHeader} from "./SectionHeader";
import {ReactComponent as Plus} from "../assets/plus.svg";
import {ReactComponent as Minus} from "../assets/minus.svg";
import {useDispatch} from "react-redux";
import {actions} from "../actions";
import cn from "classnames";
import {EScreenSize} from "../routes/common/screenSize";
import {Images} from "./Images";
import {config} from "../config";
import {TImageManifest} from "../types/imageManifest";

export const SectionVisual: FC<{
  imageData?: string;
  imageLqipData?: string;
  filename?: string;
  screenSize?: EScreenSize;
  manifest?: TImageManifest | null;
  imageLoaded?: boolean;
}> = ({imageData, imageLqipData, filename, screenSize, manifest, imageLoaded}) => {
  const dispatch = useDispatch();

  return <div className={styles.visual} onClick={() => dispatch(actions.nextImage())}>
    <Images
      imageData={imageData}
      imageLqipData={imageLqipData}
      filename={filename}
      screenSize={screenSize}
      manifest={manifest}
      imageLoaded={imageLoaded}
    />
  </div>
}

export const Section: FC<{ state: TReadyAppState, anchorMenu?: ReactNode, children: ReactNode }> = ({state, children, anchorMenu}) => {
  const dispatch = useDispatch();

  // Determine if we should show images
  const hasImages = config.useOptimizedImages
    ? (state as any).currentImage
    : ((state as any).imageUrl || (state as any).imageLqipUrl);

  return <div className={styles.sectionContainer}>
    <div className={styles.header}>
      <LogoSection />
      <MenuSec state={state}/>
      <SectionHeader state={state}/>
    </div>
    {(state as any).screenSize === EScreenSize.DESKTOP && <div className={styles.buttons}>
      {hasImages && <>
          <Minus className={styles.minus} onClick={() => dispatch(actions.previousImage())}/>
          <Plus className={styles.plus} onClick={() => dispatch(actions.nextImage())}/>
      </>
      }
    </div>
    }

    <div className={cn(styles.sectionContent, {[styles.divider]:state.menuIsOpen})}>
      {hasImages && config.useOptimizedImages &&
          <SectionVisual
            filename={(state as any).currentImage}
            screenSize={(state as any).screenSize}
            manifest={(state as any).imageManifest}
            imageLoaded={(state as any).imageLoaded}
          />}
      {hasImages && !config.useOptimizedImages &&
          <SectionVisual
            imageData={(state as any).imageData}
            imageLqipData={(state as any).imageLqipData}
          />}
     <div className={styles.textWrapper}>
      {anchorMenu && <div>
      {anchorMenu}
    </div>}

      <div className={styles.text}>
        {children}
      </div>
     </div>
    </div>
  </div>
}