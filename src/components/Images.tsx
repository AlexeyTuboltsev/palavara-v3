import React, {FC} from "react";
import cn from "classnames";
import {config} from "../config";
import styles from "./Section.module.scss";

export const Images: FC<{ imageData: string, imageLqipData: string }> = ({imageLqipData, imageData}) => {
  // In visual test mode, show gray placeholder instead of actual images
  if (config.visualTestMode) {
    return <div
      className={styles.img}
      style={{
        backgroundColor: '#e0e0e0',
        width: '100%',
        height: '100%'
      }}
      aria-hidden={true}
    />;
  }

  return <>
    {imageData && <img
        aria-hidden={true}
        loading="lazy"
        className={styles.img}
        src={imageData}
        alt=""
    />}

    {imageLqipData && <img
        alt=""
        src={imageLqipData}
        aria-hidden={true}
        className={cn(styles.imgLowRes, {[styles.lqipVisible]: imageData})}
    />}
  </>
}
