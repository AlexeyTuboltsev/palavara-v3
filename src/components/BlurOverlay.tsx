import React, {FC} from 'react';
import cn from 'classnames';
import styles from './BlurOverlay.module.scss';
import {config} from '../config';

export const BlurOverlay: FC<{visible: boolean}> = ({visible}) => {
  // Skip the overlay in visual-test mode — it would add timing-sensitive
  // fades to every page snapshot.
  if (config.visualTestMode) return null;

  return (
    <div
      className={cn(styles.overlay, {[styles.visible]: visible})}
      aria-hidden={!visible}
    />
  );
};
