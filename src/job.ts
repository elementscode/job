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
  progress?: string;
  title?: string;
}

export class Job {
  _opts: IJobOpts;
  _title: string;
  _summary: string;
  _start: number;
  _finish: number;
  _stream: stream.Writable;
  _spinner: Spinner;
  _errors: any[];

  constructor(opts: IJobOpts = {}) {
    this._opts = opts;
    this._title = opts.title || 'Job Report:';
    this._stream = opts.stream || process.stderr;
    this._spinner = new Spinner(this._stream, this.getProgressText(opts.progress || 'Processing'));
    this._errors = [];
    this._summary = '';
    this.start();
  }

  public finish(): this {
    this._spinner.stop();
    this._finish = (new Date).getTime();
    return this;
  }

  public getElapsedMilliseconds(): number {
    return this._finish - this._start;
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
    return style('  %s ', FontColor.Green) + ' ' + value;
  }

  protected getStatusText(): string {
    return this.hasErrors() ? 'Errors' : 'Ok';
  }

  public hasErrors(): boolean {
    return this._errors.length > 0;
  }

  public getReportText(): string {
    let result = '';

    result += indent(style(this._title, FontColor.Default, FontStyle.Bold), 2);
    result += '\n\n';

    result += table([
      [style('Elapsed:', FontColor.Gray), style(this.getElapsedText(), FontColor.Default, FontStyle.Dim)],
      [style('Time:', FontColor.Gray), style(this.getElapsedText(), FontColor.Default, FontStyle.Dim)],
      [style('Status:', FontColor.Gray), style(this.getStatusText(), this.hasErrors() ? FontColor.Red : FontColor.Green, FontStyle.Bold)],
    ], 4);

    if (this._summary.length > 0) {
      result += '\n';
      result += indent(style(this._summary, FontColor.Default, FontStyle.Dim), 4);
    }

    result += '\n';
    return result;
  }

  public toString(): string {
    return '[object Job]';
  }
}
