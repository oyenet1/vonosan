for pkgdir in packages/*; do
  [ -f "$pkgdir/package.json" ] || continue
  name=$(node -p "require('./$pkgdir/package.json').name")
  private=$(node -p "Boolean(require('./$pkgdir/package.json').private)")

  if [ "$private" = "true" ]; then
    echo "vonosan-pkg: $name (private)"
    continue
  fi

  version=$(node -p "require('./$pkgdir/package.json').version")
  if npm view "$name@$version" version >/dev/null 2>&1; then
    echo "vonosan-pkg: $name@$version (already published)"
  else
    echo "vonosan-pkg: $name@$version (not published / failed)"
  fi
done
