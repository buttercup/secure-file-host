## Modules

<dl>
<dt><a href="#module_SecureFileHost">SecureFileHost</a></dt>
<dd></dd>
</dl>

## Functions

<dl>
<dt><a href="#createHost">createHost(port, key)</a> ⇒ <code><a href="#Host">Host</a></code></dt>
<dd><p>Create a new host instance</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Host">Host</a> : <code>Object</code></dt>
<dd><p>Host instance</p>
</dd>
</dl>

<a name="module_SecureFileHost"></a>

## SecureFileHost

* [SecureFileHost](#module_SecureFileHost)
    * _static_
        * [.startFileHost(port, [key])](#module_SecureFileHost.startFileHost) ⇒ <code>HostWithKey</code>
    * _inner_
        * [~HostWithKey](#module_SecureFileHost..HostWithKey) : [<code>Host</code>](#Host)

<a name="module_SecureFileHost.startFileHost"></a>

### SecureFileHost.startFileHost(port, [key]) ⇒ <code>HostWithKey</code>
Start a new file host

**Kind**: static method of [<code>SecureFileHost</code>](#module_SecureFileHost)  
**Returns**: <code>HostWithKey</code> - A Host instance with an encryption key  

| Param | Type | Description |
| --- | --- | --- |
| port | <code>Number</code> | The port to listen on |
| [key] | <code>String</code> | The encryption key for encrypting traffic between  the host and the client. If not specified a random key will be  generated. |

<a name="module_SecureFileHost..HostWithKey"></a>

### SecureFileHost~HostWithKey : [<code>Host</code>](#Host)
**Kind**: inner typedef of [<code>SecureFileHost</code>](#module_SecureFileHost)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | The encryption key used on the host |

<a name="createHost"></a>

## createHost(port, key) ⇒ [<code>Host</code>](#Host)
Create a new host instance

**Kind**: global function  
**Returns**: [<code>Host</code>](#Host) - A new host instance  

| Param | Type | Description |
| --- | --- | --- |
| port | <code>Number</code> \| <code>undefined</code> | The port to listen on |
| key | <code>String</code> | The encryption key |

<a name="Host"></a>

## Host : <code>Object</code>
Host instance

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| app | <code>Object</code> | ExpressJS application instance |
| emitter | <code>Object</code> | Event emitter instance |
| server | <code>Object</code> \| <code>null</code> | ExpressJS server instance |
| [stop] | <code>function</code> | Method to stop the host from serving |
| cancel | <code>function</code> | Method to cancel the current connection attempt |

