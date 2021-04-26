// Generic version.  MVC Specific version is in MVC as _jsParse

export default async function ASTParser(ev, ast) {
  const parse = async function(obj) {
    let result;

    switch (obj.type) {
      case 'CallExpression':
        let callee = obj.callee.name;
        let args = [ev];

        if (callee in callees) {
          for (let i=0; i<obj.arguments.length; i++) {
            args.push(await parse(obj.arguments[i]));
          }

          result = await callees[callee](...args);
        }
        else {
          throw `${callee} Not a Valid Function`;
        }

        break;  

      case 'BinaryExpression':
        // left/right
        result = 0;

        let left = await parse(obj.left);
        let right = await parse(obj.right);

        switch (obj.operator) {
          case '+':
            result = left + right;
            break;

          case '-':
            result = left - right
            break;

          case '*':
            result = left * right;
            break;

          case '/':
            try {
              result = left / right;
            }
            catch(err) {
              result = 0;
            }

            break;

          case '^':
            result = left ^ right;
            break;
  
          case '%':
            result = left % right;
            break;
  
          case '>':
            result = left > right;
            break;

          case '>=':
            result = left >= right;
            break;            
  
          case '<':
            result = left < right;
            break;  

          case '<=':
            result = left <= right;
            break;  

          case '==':
            result = left == right;
            break;            

          case '!=':
            result = left != right;
            break;            
      
          }

        break;

      case 'ObjectLiteral':
        // build a new object with interpreted values
        result = {};

        for (let p=0; p<obj.properties.length; p++) {
          let res = await parse(obj.properties[p].value);

          result[obj.properties[p].name] = res;
        }

        break;

      case 'ArrayLiteral':
        // build a new array with interpreted values
        result = [];

        for (let p=0; p<obj.elements.length; p++) {
          let res = await parse(obj.elements[p]);

          result.push(res);
        }

        break;
  
      case 'MemberExpression':
        // obj.mema.memb
        result = obj.text;

      case 'Identifier':
        // Not string, object, etc
        // this is an index into this.model
        result = obj.text;
        break;

      case 'Literal':
        // self-explanatory
        result = obj.value;
        break;

      default:
        break;
    }

    return result;
  }

  return await parse(ast);
}