"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMessage = void 0;
// User defined type guard
// Type checking cannot be performed during the execution (we don't have the Message interface anyway)
// but we can create a function to check if the supplied parameter is compatible with a given type
//
// A better approach is to use JSON schema
//
function isMessage(arg) {
    return arg && arg.content && typeof (arg.content) == 'string' && arg.tags && Array.isArray(arg.tags) && arg.timestamp && arg.timestamp instanceof Date;
}
exports.isMessage = isMessage;
//# sourceMappingURL=Message.js.map