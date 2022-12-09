#!/bin/bash
if [ -z "${1}" ] ; then
	echo "iobroker"
fi
if [ "${1}" == "1" ]; then
	if [ ! -f "/etc/init.d/device_off.sh" ]; then
		echo "#!/bin/bash" > /etc/init.d/device_off.sh
		echo "wget ${2}2" >> /etc/init.d/device_off.sh
		echo "exit 0" >> /etc/init.d/device_off.sh
		chmod 775 /etc/init.d/device_off.sh
	fi
	if [ ! -f "/etc/init.d/device_on.sh" ]; then
		echo "#!/bin/bash" > /etc/init.d/device_on.sh
		echo "wget ${2}1" >> /etc/init.d/device_on.sh
		echo "exit 0" >> /etc/init.d/device_on.sh
		chmod 775 /etc/init.d/device_on.sh
	fi
	if [ ! -L "/etc/rc0.d/K05device_off.sh" ]; then
		ln -s /etc/init.d/device_off.sh /etc/rc0.d/K05device_off.sh
	fi
	if [ ! -L "/etc/rc1.d/K05device_off.sh" ]; then
		ln -s /etc/init.d/device_off.sh /etc/rc1.d/K05device_off.sh
	fi
	if [ ! -L "/etc/rc3.d/S93device_on.sh" ]; then
		ln -s /etc/init.d/device_on.sh /etc/rc3.d/S93device_on.sh
	fi
fi
if [ "${1}" == "2" ]; then
	if [ -f "/etc/init.d/device_off.sh" ]; then
		rm /etc/init.d/device_off.sh
	fi
	if [ -f "/etc/init.d/device_on.sh" ]; then
		rm /etc/init.d/device_on.sh
	fi
	if [ -L "/etc/rc0.d/K05device_off.sh" ]; then
		unlink /etc/rc0.d/K05device_off.sh
	fi
	if [ -L "/etc/rc1.d/K05device_off.sh" ]; then
		unlink /etc/rc1.d/K05device_off.sh
	fi
	if [ -L "/etc/rc3.d/S93device_on.sh" ]; then
		unlink /etc/rc3.d/S93device_on.sh
	fi
fi
exit 0