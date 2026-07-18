/**
 * Event payloads, identical to FastImage's event shapes.
 */

/** Payload of the `onLoad` event. */
export interface OnLoadEvent {
  nativeEvent: {
    /** Intrinsic width of the loaded image, in pixels. */
    width: number;
    /** Intrinsic height of the loaded image, in pixels. */
    height: number;
  };
}

/** Payload of the `onProgress` event. */
export interface OnProgressEvent {
  nativeEvent: {
    /** Bytes downloaded so far. */
    loaded: number;
    /** Total bytes to download. */
    total: number;
  };
}
