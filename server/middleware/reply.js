const reply = function(res, rm) {
  // Send Reply from a ResponseMessage
  res.setHeader("Content-Type", rm['Content-Type']);
  res.statusCode = rm.status || 500;
  
  // any cookies?
  if (rm.cookies && rm.cookies.length > 0) {
		const unary = ['HttpOnly'];
    let cookies = [];
    
    rm.cookies.forEach(function(cookie) {
			if ('name' in cookie && 'value' in cookie) {
				let cookieValue = `${cookie.name}=${cookie.value}`;

				delete cookie.name;
				delete cookie.value;

				Object.keys(cookie).forEach(function(key) {
					cookieValue += `;${key}`;
					(!(key in unary)) cookieValue  += `=${cookie[key]}`;
				});

				cookies.push(cookieValue);
			}
    })

    res.setHeader('Set-Cookie', cookies);
  }
  
  // redirect?
  if (res.statusCode == 302) {
    res.setHeader('Location', rm.data);
  }

  res.write(rm.data, rm.encoding || 'utf8');
  res.end();  
}

module.exports = {
	reply: reply
}