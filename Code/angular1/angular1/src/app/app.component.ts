import { Component } from '@angular/core';

class UniqueId {
  private num = 0;
  public get(): number {
    this.num = this.num + 1;
    return this.num;
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'My product page';
  products: {id: number, name: string}[] = [];
  private idgen = new UniqueId();

  num_products(): number {
    return this.products.length;
  }

  get_products()  {
    return this.products;
  }

  add_product( p: string ) {
    this.products.push( {id: this.idgen.get(), name: p } );
  }

  delete_product( id: number ) {
    for ( let i = 0; i < this.products.length; ++i ) {
      if ( this.products[i].id === id ) {
        this.products.splice(i, 1);
        return;
      }
    }
  }
}
