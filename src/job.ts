import * as stream from 'stream';
import {
  padZeros,
  indent,
} from '@elements/utils';
import {
  Spinner,
  style,
  FontColor,
  FontStyle,
  table,
} from '@elements/term';

export interface IJobOpts {
  stream?: stream.Writable;
  spinner?: boolean;
  progressText?: string;
  title?: string;
}

export class Job {
  _opts: IJobOpts;
  _summary: string;
  _start: number;
  _finish: number;
  _stream: stream.Writable;
  _spinner: Spinner;
  _errors: any[];

  constructor(opts: IJobOpts = {}) {
    this._opts = opts;
    this._stream = opts.stream || process.stderr;
    this._spinner = new Spinner(this._stream, this.getProgressText(opts.progressText || 'Processing'));
    this._errors = [];
    this._summary = '';
    this.start();
  }

  public addError(err: any): this {
    this._errors.push(err);
    return this;
  }

  public getErrors(): any[] {
    return this._errors;
  }

  public finish(): this {
    this._spinner.stop();
    this._finish = (new Date).getTime();
    return this;
  }

  public getElapsedMilliseconds(): number {
    return this._finish ? this._finish - this._start : 0;
  }

  public getElapsedSeconds(): number {
    return this.getElapsedMilliseconds() / 1000;
  }

  public getElapsedText(): string {
    return this.getElapsedSeconds() + 's';
  }

  public getFinishTime(): Date {
    return new Date(this._finish);
  }

  public getFinishTimeText(): string {
    let finish = this.getFinishTime();

    let hrs = finish.getHours() % 12;
    let mins = finish.getMinutes();
    let secs = finish.getSeconds();
    let ampm = finish.getHours() > 12 ? 'pm' : 'am';

    return padZeros(hrs, 2) + ':' + padZeros(mins, 2) + ':' + padZeros(secs, 2) + ampm;
  }

  public progress(text: string): this {
    this._spinner.setText(this.getProgressText(text));
    return this;
  }

  public summary(text: string): this {
    this._summary = text;
    return this;
  }

  protected start() {
    this._start = (new Date).getTime();
    if (this._opts.spinner !== false) {
      this._spinner.start();
    }
  }

  protected getProgressText(value: string): string {
    return style.progress('  %s ') + ' ' + value;
  }

  protected getStatusText(): string {
    return this.hasErrors() ? 'Error' : 'Ok';
  }

  public hasErrors(): boolean {
    return this._errors.length > 0;
  }

  public getReportText(): string {
    let result = '\n';

    result += table([
      [style.label('Elapsed:'), style.subtle(this.getElapsedText())],
      [style.label('Time:'), style.subtle(this.getFinishTimeText())],
      [style.label('Status:'), this.hasErrors() ? style.berror(this.getStatusText()) : style.bsuccess(this.getStatusText())],
    ], 2);

    if (this._summary.length > 0) {
      result += '\n';
      result += indent(this._summary, 2);
    }

    result += '\n';
    return result;
  }

  public toString(): string {
    return '[object Job]';
  }

  public writeTo(stream: stream.Writable): this {
    stream.write(this.getReportText());
    return this;
  }

  public exitCode(): number {
    return this.hasErrors() ? 1 : 0;
  }

  public exit(): void {
    process.exit(this.exitCode());
  }
}
