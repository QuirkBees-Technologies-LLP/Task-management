import { grey } from '@mui/material/colors';
import { hexToRgbChannel, varAlpha } from './utils';

export const shadows: any = (primaryColor) => {
  const greyChannel = hexToRgbChannel(grey[500]);
  const primaryChannel = hexToRgbChannel(primaryColor);
  const greyShadow = varAlpha(greyChannel, 0.3);
  const primaryShadow = varAlpha(primaryChannel, 0.15);

  return [
    'none',
    `0px 0px 3px 0px ${greyShadow}, 0px 0px 1px 0px ${primaryShadow}`,
    `0px 0px 5px 0px ${greyShadow}, 0px 0px 2px 0px ${primaryShadow}`,
    `0px 0px 8px 0px ${greyShadow}, 0px 0px 4px 0px ${primaryShadow}`,
    `0px 0px 4px -1px ${greyShadow}, 0px 0px 5px 0px ${primaryShadow}`,
    `0px 0px 5px -1px ${greyShadow}, 0px 0px 8px 0px ${primaryShadow}`,
    `0px 0px 5px -1px ${greyShadow}, 0px 0px 10px 0px ${primaryShadow}`,
    `0px 0px 5px -2px ${greyShadow}, 0px 0px 10px 1px ${primaryShadow}`,
    `0px 0px 5px -3px ${greyShadow}, 0px 0px 12px 1px ${primaryShadow}`,
    `0px 0px 6px -3px ${greyShadow}, 0px 0px 14px 1px ${primaryShadow}`,
    `0px 0px 6px -3px ${greyShadow}, 0px 0px 15px 1px ${primaryShadow}`,
    `0px 0px 6px -3px ${greyShadow}, 0px 0px 18px 1px ${primaryShadow}`,
    `0px 0px 7px -4px ${greyShadow}, 0px 0px 20px 2px ${primaryShadow}`,
    `0px 0px 8px -4px ${greyShadow}, 0px 0px 22px 2px ${primaryShadow}`,
    `0px 0px 8px -4px ${greyShadow}, 0px 0px 24px 2px ${primaryShadow}`,
    `0px 0px 9px -5px ${greyShadow}, 0px 0px 26px 2px ${primaryShadow}`,
    `0px 0px 10px -5px ${greyShadow}, 0px 0px 28px 2px ${primaryShadow}`,
    `0px 0px 11px -5px ${greyShadow}, 0px 0px 30px 2px ${primaryShadow}`,
    `0px 0px 12px -6px ${greyShadow}, 0px 0px 32px 2px ${primaryShadow}`,
    `0px 0px 13px -6px ${greyShadow}, 0px 0px 34px 2px ${primaryShadow}`,
    `0px 0px 14px -6px ${greyShadow}, 0px 0px 36px 3px ${primaryShadow}`,
    `0px 0px 15px -7px ${greyShadow}, 0px 0px 38px 3px ${primaryShadow}`,
    `0px 0px 16px -7px ${greyShadow}, 0px 0px 40px 3px ${primaryShadow}`,
    `0px 0px 17px -7px ${greyShadow}, 0px 0px 42px 3px ${primaryShadow}`,
    `0px 0px 17px -8px ${greyShadow}, 0px 0px 44px 4px ${primaryShadow}`,
  ];
};
