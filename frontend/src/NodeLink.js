// /* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// import Inline from 'quill';

// class NodeLink extends Inline {
//   static create(value) {
//     const node = super.create(value);
//     node.setAttribute('href', this.sanitize(value));
//     node.setAttribute('rel', 'noopener noreferrer');
//     // node.setAttribute('target', '_blank');
//     return node;
//   }

//   static formats(domNode) {
//     return domNode.getAttribute('href');
//   }

//   static sanitize(url) {
//     return sanitize(url, this.PROTOCOL_WHITELIST) ? url : this.SANITIZED_URL;
//   }

//   format(name, value) {
//     if (name !== this.statics.blotName || !value) {
//       super.format(name, value);
//     } else {
//       this.domNode.setAttribute('href', this.constructor.sanitize(value));
//     }
//   }
// }
// NodeLink.blotName = 'link';
// NodeLink.tagName = 'A';
// NodeLink.SANITIZED_URL = 'about:blank';
// NodeLink.PROTOCOL_WHITELIST = ['http', 'https', 'mailto', 'tel'];

// function sanitize(url, protocols) {
//   const anchor = document.createElement('a');
//   anchor.href = url;
//   const protocol = anchor.href.slice(0, anchor.href.indexOf(':'));
//   return protocols.indexOf(protocol) > -1;
// }

// export { NodeLink as default, sanitize };
