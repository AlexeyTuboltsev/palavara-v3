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
import {getImageManifest} from "../sagas/imageManifestLoader";
import {TImageManifest} from "../types/imageManifest";

export const SectionVisual: FC<{
  filename: string;
  screenSize: EScreenSize;
  manifest: TImageManifest | null;
  imageLoaded: boolean;
}> = ({filename, screenSize, manifest, imageLoaded}) => {
  const dispatch = useDispatch();

  return <div className={styles.visual} onClick={() => dispatch(actions.nextImage())}>
    <Images
      filename={filename}
      screenSize={screenSize}
      manifest={manifest}
      imageLoaded={imageLoaded}
    />
  </div>
}

export const Section: FC<{ state: TReadyAppState, anchorMenu?: ReactNode, children: ReactNode }> = ({state, children, anchorMenu}) => {
  const dispatch = useDispatch();

  const totalImages = (state as any).totalImages || 0;
  const hasImages = totalImages > 0;
  const showImageButtons = totalImages > 1;
  const manifest = getImageManifest();

  return <div className={styles.sectionContainer}>
    <div className={styles.header}>
      <LogoSection />
      <MenuSec state={state}/>
      <SectionHeader state={state}/>
    </div>
    {(state as any).screenSize === EScreenSize.DESKTOP && <div className={styles.buttons}>
      {showImageButtons && <>
          <Minus className={styles.minus} onClick={() => dispatch(actions.previousImage())}/>
          <Plus className={styles.plus} onClick={() => dispatch(actions.nextImage())}/>
      </>
      }
    </div>
    }

    <div className={cn(styles.sectionContent, {[styles.divider]:state.menuIsOpen})}>
      {hasImages &&
          <SectionVisual
            filename={(state as any).currentImage}
            screenSize={(state as any).screenSize}
            manifest={manifest}
            imageLoaded={(state as any).imageLoaded}
          />}
     <div className={styles.textWrapper}>
      {anchorMenu && <div>
      {anchorMenu}
    </div>}

      <div className={styles.text}>
        {children}
      </div>
      {hasImages && (state as any).screenSize === EScreenSize.MOBILE &&
        <div className={styles.mobileImage}>
          <Images
            filename={(state as any).currentImage}
            screenSize={(state as any).screenSize}
            manifest={manifest}
            imageLoaded={(state as any).imageLoaded}
          />
        </div>
      }
     </div>
    </div>
  </div>
}