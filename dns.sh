ip_1=$1
ip_2=$2

if [ "$ip_1" != "" ] && [ "$ip_2" != "" ]; then
    echo "nameserver $ip_1" > /etc/resolv.conf
    echo "nameserver $ip_2" >> /etc/resolv.conf
else
  echo ERROR: Need two ip addresses
  exit 1
fi