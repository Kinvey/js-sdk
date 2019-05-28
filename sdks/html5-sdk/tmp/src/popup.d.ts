/// <reference types="node" />
import { EventEmitter } from 'events';
declare class Popup extends EventEmitter {
    private popupWindow;
    private interval;
    constructor(popupWindow: Window);
    isClosed(): boolean;
    onLoaded(listener: (...args: any[]) => void): this;
    onClosed(listener: (...args: any[]) => void): this;
    onError(listener: (...args: any[]) => void): this;
    close(): Promise<void>;
    static open(url: string): Promise<Popup>;
}
export declare function open(url: string): Promise<Popup>;
export {};
