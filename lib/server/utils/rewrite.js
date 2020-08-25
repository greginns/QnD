// class to add, find /app/version/subapp/path - ified url
const rewriteList = [];
const shortcutList = new Map();

class Rewrite {
  constructor() {
  }

  static add(oldPath, newPath) {
console.log('REWRITING', oldPath, newPath)    
    rewriteList.push([oldPath, newPath]);
  }

  static get(path) {
    // could be direct, could be partial
    let pparts = path.split('/');
    let possiblePaths = [];

    for (let [oldPath, newPath] of rewriteList) {
      let oparts = oldPath.split('/');
      let good = true;

      if (oparts.length == pparts.length) {
        let varCount = 0;

        for (let j=0; j<oparts.length; j++) {
          if (oparts[j] != pparts[j] && oparts[j].substr(0,1) != ':') {
            good = false;
            break;
          }

          if (oparts[j].substr(0,1) == ':') varCount++;
        }

        if (good) {
          possiblePaths.push([newPath, varCount]);
        }
      }
    }

    if (possiblePaths.length > 0) {
      // rank possibles by fewest variables
      possiblePaths.sort(function(a,b) {
        return (a[1] < b[1]) ? -1 : a[1] > b[1] ? 1 : 0;
      })

      return possiblePaths[0][0]; 
    }

    return false;
  }
}

// class to save, find shortcuts.  ie ~static = /static/v1/static
class Shortcut {
  constructor() {
  }

  static add(oldPath, newPath) {
    shortcutList.set(oldPath, newPath);
  }

  static get(path) {
    let pparts = path.split('/');

    if (pparts.length > 0) {
      let p1 = pparts[1];

      if (shortcutList.has(p1)) {
        let nPath = shortcutList.get(p1).split('/');

        pparts.splice(1, 1, ...nPath);

        return pparts.join('/');
      }
    }

    return false;
  }
}

module.exports = {Rewrite, Shortcut};