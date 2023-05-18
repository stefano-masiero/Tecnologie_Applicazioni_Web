import { Component, OnInit, EventEmitter, Output  } from '@angular/core';
import {Message} from '../Message';
import { MessageHttpService } from '../message-http.service';

@Component({
  selector: 'app-message-editor',
  templateUrl: './message-editor.component.html',
  styleUrls: ['./message-editor.component.css']
})
export class MessageEditorComponent implements OnInit {

  constructor( private ms: MessageHttpService ) { }
  public message: Message = this.set_empty();


  @Output() posted = new EventEmitter<Message>();

  ngOnInit() {
    this.set_empty();
  }

  set_empty(): Message {
    this.message = { tags: [], content: '', timestamp: new Date(), authormail: '' };
    return this.message;
  }

  get_tags() {
    return this.message.tags;
  }

  add_tag( tag: string ) {
    this.message.tags = this.message.tags.concat([ tag]);
  }

  post_message( ) {
    this.message.timestamp = new Date();
    this.ms.post_message( this.message ).subscribe( {
      next: (m) => {
      console.log('Message posted');
      this.set_empty();
      this.posted.emit( m );

    },
    error: (error) => {
      console.log('Error occurred while posting: ' + error);

    }});
  }

}
