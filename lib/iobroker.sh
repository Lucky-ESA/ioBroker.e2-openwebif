#!/bin/bash
if [ -z "${1}" ] ; then
	if [ ! -f "/etc/init.d/<device>_on.sh" ]; then
		echo "iobroker missing"
		exit 1
	fi
	if [ ! -f "/etc/init.d/<device>_off.sh" ]; then
		echo "iobroker missing"
		exit 2
	fi
	if [ ! -L "/etc/rc0.d/K05_<device>_off.sh" ]; then
		echo "iobroker missing"
		exit 3
	fi
	if [ ! -L "/etc/rc1.d/K05_<device>_off.sh" ]; then
		echo "iobroker missing"
		exit 4
	fi
	if [ ! -L "/etc/rc3.d/S99_<device>_on.sh" ]; then
		echo "iobroker missing"
		exit 5
	fi
	echo "iobroker"
	exit 6
fi
if [ "${1}" == "1" ]; then
	if [ ! -f "/etc/init.d/<device>_off.sh" ]; then
		echo "#!/bin/bash" > /etc/init.d/<device>_off.sh
		echo "wget -O - -q ${2}2 >/dev/null 2>&1" >> /etc/init.d/<device>_off.sh
		echo "exit 0" >> /etc/init.d/<device>_off.sh
		chmod 775 /etc/init.d/<device>_off.sh
	fi
	if [ ! -f "/etc/init.d/<device>_on.sh" ]; then
		echo "#!/bin/bash" > /etc/init.d/<device>_on.sh
		echo "wget -O - -q ${2}1 >/dev/null 2>&1" >> /etc/init.d/<device>_on.sh
		echo "exit 0" >> /etc/init.d/<device>_on.sh
		chmod 775 /etc/init.d/<device>_on.sh
	fi
	if [ ! -L "/etc/rc0.d/K05_<device>_off.sh" ]; then
		ln -s /etc/init.d/<device>_off.sh /etc/rc0.d/K05_<device>_off.sh
	fi
	if [ ! -L "/etc/rc1.d/K05_<device>_off.sh" ]; then
		ln -s /etc/init.d/<device>_off.sh /etc/rc1.d/K05_<device>_off.sh
	fi
	if [ ! -L "/etc/rc3.d/S99_<device>_on.sh" ]; then
		ln -s /etc/init.d/<device>_on.sh /etc/rc3.d/S99_<device>_on.sh
	fi
fi
if [ "${1}" == "2" ]; then
	if [ -f "/etc/init.d/<device>_off.sh" ]; then
		rm /etc/init.d/<device>_off.sh
	fi
	if [ -f "/etc/init.d/<device>_on.sh" ]; then
		rm /etc/init.d/<device>_on.sh
	fi
	if [ -L "/etc/rc0.d/K05_<device>_off.sh" ]; then
		unlink /etc/rc0.d/K05_<device>_off.sh
	fi
	if [ -L "/etc/rc1.d/K05_<device>_off.sh" ]; then
		unlink /etc/rc1.d/K05_<device>_off.sh
	fi
	if [ -L "/etc/rc3.d/S99_<device>_on.sh" ]; then
		unlink /etc/rc3.d/S99_<device>_on.sh
	fi
fi
if [ "${1}" == "3" ]; then
	echo $(wget -O - -q http://127.0.0.1/web/timerlist |grep "e2state" | grep -c ">2<")
fi
exit 0